package com.queryanalyzer.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.queryanalyzer.backend.domain.ExecutionPlan;
import com.queryanalyzer.backend.domain.QueryIssue;
import com.queryanalyzer.backend.domain.QueryLog;
import com.queryanalyzer.backend.repository.ExecutionPlanRepository;
import com.queryanalyzer.backend.repository.QueryIssueRepository;
import com.queryanalyzer.backend.repository.QueryLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExecutionPlanService {

    private final JdbcTemplate jdbcTemplate;
    private final ExecutionPlanRepository planRepository;
    private final QueryIssueRepository issueRepository;
    private final QueryLogRepository queryLogRepository;
    private final ObjectMapper objectMapper;

    // LRU Cache for parsed execution plans (keyed by sqlHash) to prevent re-explaining the same pattern
    private final java.util.Map<String, ParsedPlan> planCache = java.util.Collections.synchronizedMap(
        new java.util.LinkedHashMap<String, ParsedPlan>(100, 0.75f, true) {
            protected boolean removeEldestEntry(java.util.Map.Entry<String, ParsedPlan> eldest) {
                return size() > 1000;
            }
        }
    );

    /**
     * Called only for SLOW queries. Runs EXPLAIN (not ANALYZE) to avoid
     * side effects on DML statements. Returns the persisted ExecutionPlan,
     * or null if the explain fails (e.g. query references tables not in
     * this DB — log and continue).
     * 
     * IMPORTANT: This method must be called AFTER the QueryLog transaction
     * has committed, otherwise the FK constraint will fail. It accepts a
     * QueryLog ID instead of the entity to avoid lazy loading issues.
     * Runs in REQUIRES_NEW transaction to isolate EXPLAIN failures.
     */
    @org.springframework.transaction.annotation.Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public ExecutionPlan explainById(UUID queryLogId) {
        // Reload the QueryLog in this new transaction to ensure it's visible
        QueryLog reloaded = queryLogRepository.findById(queryLogId).orElse(null);
        if (reloaded == null) {
            log.warn("QueryLog {} not found in explain transaction", queryLogId);
            return null;
        }
        
        // Replace ? placeholders with representative literals for EXPLAIN
        String explainableSql = prepareSqlForExplain(reloaded.getSqlText());
        String explainSql = "EXPLAIN (FORMAT JSON) " + explainableSql;
        try {
            ParsedPlan parsed;

            if (reloaded.getSqlHash() != null && planCache.containsKey(reloaded.getSqlHash())) {
                parsed = planCache.get(reloaded.getSqlHash());
                log.debug("Using cached EXPLAIN plan for sqlHash={}", reloaded.getSqlHash());
            } else {
                // Use a localized JdbcTemplate instance to safely set a per-query timeout
                JdbcTemplate localJdbcTemplate = new JdbcTemplate(jdbcTemplate.getDataSource());
                localJdbcTemplate.setQueryTimeout(3); // 3 seconds timeout
                
                String planJson = localJdbcTemplate.queryForObject(explainSql, String.class);
                if (planJson == null) return null;

                parsed = parsePlan(planJson);
                parsed = parsed.withPlanJson(planJson); // Need to attach raw JSON for the entity

                if (reloaded.getSqlHash() != null) {
                    planCache.put(reloaded.getSqlHash(), parsed);
                }
            }

            ExecutionPlan plan = ExecutionPlan.builder()
                .queryLog(reloaded)
                .planJson(parsed.planJson())
                .scanType(parsed.scanType())
                .rowsScanned(parsed.rowsScanned())
                .startupCost(parsed.startupCost())
                .totalCost(parsed.totalCost())
                .analyzedAt(Instant.now())
                .build();

            planRepository.save(plan);

            // Generate rule-based issue if seq scan detected
            if ("SEQ_SCAN".equals(parsed.scanType())) {
                createMissingIndexIssue(reloaded, parsed);
            }

            return plan;

        } catch (Exception e) {
            log.warn("EXPLAIN failed for queryLogId={}: {}", queryLogId, e.getMessage());
            return null;
        }
    }

    // ── Plan parsing ─────────────────────────────────────────────

    /**
     * Prepare SQL for EXPLAIN by replacing ? placeholders with representative literals.
     * PostgreSQL EXPLAIN cannot parse ? placeholders, so we substitute values that
     * allow the planner to determine the scan strategy without needing exact data.
     */
    private String prepareSqlForExplain(String sql) {
        if (sql == null) return null;
        
        // Replace ? placeholders with representative values
        // For LIKE patterns, use a generic wildcarded string
        // For numeric parameters, use 1
        // For string parameters, use 'test'
        return sql.replaceAll("\\?", "'test'")
                .replaceAll("'test' ESCAPE", "'test' ESCAPE"); // Preserve ESCAPE clauses
    }

    private record ParsedPlan(
        String planJson,
        String scanType,
        Long rowsScanned,
        BigDecimal startupCost,
        BigDecimal totalCost,
        String relationName,
        String filterColumn
    ) {
        public ParsedPlan withPlanJson(String json) {
            return new ParsedPlan(json, scanType, rowsScanned, startupCost, totalCost, relationName, filterColumn);
        }
    }

    private ParsedPlan parsePlan(String planJson) throws Exception {
        // PostgreSQL EXPLAIN FORMAT JSON returns: [{"Plan": {...}}]
        JsonNode root = objectMapper.readTree(planJson)
            .get(0)
            .get("Plan");

        String scanType    = mapNodeType(root.path("Node Type").asText());
        long   rows        = root.path("Plan Rows").asLong(0);
        double startCost   = root.path("Startup Cost").asDouble(0);
        double totalCost   = root.path("Total Cost").asDouble(0);
        String relation    = root.path("Relation Name").asText(null);
        String filter      = root.path("Filter").asText(null);
        String filterCol   = extractColumnFromFilter(filter);

        return new ParsedPlan(
            planJson, scanType, rows,
            BigDecimal.valueOf(startCost),
            BigDecimal.valueOf(totalCost),
            relation, filterCol
        );
    }

    private String mapNodeType(String nodeType) {
        return switch (nodeType) {
            case "Seq Scan"         -> "SEQ_SCAN";
            case "Index Scan"       -> "INDEX_SCAN";
            case "Index Only Scan"  -> "INDEX_ONLY_SCAN";
            case "Bitmap Heap Scan" -> "BITMAP_SCAN";
            case "Nested Loop"      -> "NESTED_LOOP";
            default                 -> "OTHER";
        };
    }

    private String extractColumnFromFilter(String filter) {
        if (filter == null) return null;
        // e.g. "(user_id = $1)" -> "user_id"
        var m = java.util.regex.Pattern
            .compile("\\((\\w+)\\s*[=<>]")
            .matcher(filter);
        return m.find() ? m.group(1) : null;
    }

    // ── Issue generation ─────────────────────────────────────────

    private void createMissingIndexIssue(QueryLog queryLog, ParsedPlan parsed) {
        boolean exists = issueRepository
            .existsByQueryLogAndIssueType(queryLog, "MISSING_INDEX");
        if (exists) return;

        String table  = parsed.relationName() != null ? parsed.relationName() : "unknown_table";
        String suggestion;

        if (parsed.filterColumn() != null) {
            String col = parsed.filterColumn();
            String idxName = "idx_" + table + "_" + col;
            suggestion = String.format(
                "Sequential Scan on table '%s' (scanned ~%d rows). " +
                "Consider: CREATE INDEX CONCURRENTLY %s ON %s(%s); " +
                "Expected improvement: Seq Scan -> Index Scan.",
                table, parsed.rowsScanned(), idxName, table, col
            );
        } else {
            suggestion = String.format(
                "Sequential Scan on table '%s' (scanned ~%d rows). " +
                "Consider adding an index on the filtered column. " +
                "Expected improvement: Seq Scan -> Index Scan.",
                table, parsed.rowsScanned()
            );
        }

        issueRepository.save(QueryIssue.builder()
            .queryLog(queryLog)
            .issueType("MISSING_INDEX")
            .severity("HIGH")
            .ruleSuggestion(suggestion)
            .resolved(false)
            .createdAt(Instant.now())
            .build());
    }
}
