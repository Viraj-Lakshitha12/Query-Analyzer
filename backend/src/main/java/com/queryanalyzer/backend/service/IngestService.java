package com.queryanalyzer.backend.service;

import com.queryanalyzer.backend.domain.App;
import com.queryanalyzer.backend.domain.QueryLog;
import com.queryanalyzer.backend.dto.QueryEventRequest;
import com.queryanalyzer.backend.repository.AppRepository;
import com.queryanalyzer.backend.repository.QueryLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class IngestService {

    private final AppRepository appRepository;
    private final QueryLogRepository queryLogRepository;
    private final AnalysisCoordinator analysisCoordinator;

    private static final Pattern TABLE_PATTERN = Pattern.compile(
            "(?:FROM|INTO|UPDATE|JOIN)\\s+(\\w+)",
            Pattern.CASE_INSENSITIVE
    );

    @Async
    @Transactional
    public void processBatchAsync(UUID appId, List<QueryEventRequest> events) {
        App app = appRepository.findById(appId).orElse(null);
        if (app == null) {
            log.warn("IngestService: unknown appId={}", appId);
            return;
        }

        // Phase 1: Save all QueryLogs (this transaction commits here)
        List<QueryLog> savedLogs = new ArrayList<>();
        for (QueryEventRequest event : events) {
            try {
                QueryLog saved = processOne(app, event);
                if (saved != null) {
                    savedLogs.add(saved);
                }
            } catch (Exception e) {
                log.error("Failed to process query event: {}", e.getMessage());
                // continue processing remaining events in batch
            }
        }
        
        // Phase 2: Run analysis after QueryLogs are committed
        // This happens in a separate transactional context via AnalysisCoordinator
        for (QueryLog saved : savedLogs) {
            try {
                analysisCoordinator.analyze(saved);
            } catch (Exception e) {
                log.error("Failed to analyze query log {}: {}", saved.getId(), e.getMessage());
            }
        }
    }

    private static final String SQL_UNAVAILABLE_MARKER = "sql unavailable";

    private QueryLog processOne(App app, QueryEventRequest event) {
        // 0. Guard against null or blank SQL text
        if (event.getSqlText() == null || event.getSqlText().trim().isEmpty()) {
            return null; // Skip empty SQL events
        }

        // Guard against the old AOP fallback placeholder (pre-datasource-proxy)
        String sqlLower = event.getSqlText().toLowerCase();
        if (sqlLower.contains(SQL_UNAVAILABLE_MARKER) || sqlLower.startsWith("sql unavail")) {
            log.debug("Skipping stale AOP placeholder SQL event for app={}", app.getId());
            return null;
        }

        // 1. Normalize + hash SQL for pattern detection
        String normalized = normalizeSql(event.getSqlText());
        String sqlHash = DigestUtils.md5Hex(normalized);

        // 2. Determine status
        String status = event.getDurationMs() > app.getSlowQueryThresholdMs()
                ? "SLOW" : "FAST";

        // 3. Extract query type and table name
        String queryType = extractQueryType(event.getSqlText());
        String tableName = extractTableName(event.getSqlText());

        // 4. Build and persist
        QueryLog queryLog = QueryLog.builder()
                .app(app)
                .sqlText(event.getSqlText())
                .sqlHash(sqlHash)
                .durationMs((int) event.getDurationMs())
                .queryType(queryType)
                .tableName(tableName)
                .status(status)
                .capturedAt(event.getCapturedAt() != null
                        ? event.getCapturedAt()
                        : java.time.Instant.now())
                .callerClass(event.getCallerClass())
                .callerMethod(event.getCallerMethod())
                .build();

        QueryLog saved = queryLogRepository.save(queryLog);
        return saved;
    }

    /** Replace literal values with ? for pattern matching */
    private String normalizeSql(String sql) {
        if (sql == null) return "";
        return sql
                .replaceAll("'[^']*'", "?")       // string literals
                .replaceAll("\\b\\d+\\b", "?")     // numeric values
                .replaceAll("\\s+", " ")
                .trim()
                .toLowerCase();
    }

    private String extractQueryType(String sql) {
        if (sql == null) return null;
        String upper = sql.stripLeading().toUpperCase();
        if (upper.startsWith("SELECT")) return "SELECT";
        if (upper.startsWith("INSERT")) return "INSERT";
        if (upper.startsWith("UPDATE")) return "UPDATE";
        if (upper.startsWith("DELETE")) return "DELETE";
        return "OTHER";
    }

    private String extractTableName(String sql) {
        if (sql == null) return null;
        Matcher m = TABLE_PATTERN.matcher(sql);
        return m.find() ? m.group(1).toLowerCase() : null;
    }
}
