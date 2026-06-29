package com.queryanalyzer.backend.service;

import com.queryanalyzer.backend.dto.AnalyticsDTO;
import com.queryanalyzer.backend.dto.DailyStatDTO;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsService {

    private final EntityManager entityManager;
    private final QueryLogService queryLogService;

    public AnalyticsDTO getAnalytics(UUID appId, LocalDate from, LocalDate to) {
        AnalyticsDTO.Summary summary = getSummary(appId, from, to);
        List<DailyStatDTO> dailyStats = getDailyStats(appId, from, to);
        var topSlowQueries = queryLogService.getTopSlowQueries(appId, 10);

        return AnalyticsDTO.builder()
                .summary(summary)
                .dailyStats(dailyStats)
                .topSlowQueries(topSlowQueries)
                .build();
    }

    private AnalyticsDTO.Summary getSummary(UUID appId, LocalDate from, LocalDate to) {
        String jpqlCount = "SELECT COUNT(ql) FROM QueryLog ql WHERE ql.app.id = :appId " +
                           "AND ql.capturedAt >= :from AND ql.capturedAt < :to";
        long total = executeCount(jpqlCount, appId, from, to);

        String jpqlSlow = jpqlCount + " AND ql.status = 'SLOW'";
        long slow = executeCount(jpqlSlow, appId, from, to);

        String jpqlN1 = jpqlCount + " AND ql.status = 'N1'";
        long n1 = executeCount(jpqlN1, appId, from, to);

        String jpqlAvg = "SELECT AVG(ql.durationMs) FROM QueryLog ql WHERE ql.app.id = :appId " +
                         "AND ql.capturedAt >= :from AND ql.capturedAt < :to";
        Double avg = (Double) entityManager.createQuery(jpqlAvg)
                .setParameter("appId", appId)
                .setParameter("from", from.atStartOfDay().toInstant(java.time.ZoneOffset.UTC))
                .setParameter("to", to.plusDays(1).atStartOfDay().toInstant(java.time.ZoneOffset.UTC))
                .getSingleResult();

        // Native query for p95
        String nativeP95 = "SELECT PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) " +
                           "FROM query_logs WHERE app_id = :appId " +
                           "AND captured_at >= :from AND captured_at < :to";
        Double p95 = 0.0;
        try {
            Query query = entityManager.createNativeQuery(nativeP95)
                    .setParameter("appId", appId)
                    .setParameter("from", from.atStartOfDay().toInstant(java.time.ZoneOffset.UTC))
                    .setParameter("to", to.plusDays(1).atStartOfDay().toInstant(java.time.ZoneOffset.UTC));
            Object result = query.getSingleResult();
            if (result != null) {
                p95 = ((Number) result).doubleValue();
            }
        } catch (Exception e) {
            // handle error if no data
        }

        return AnalyticsDTO.Summary.builder()
                .totalQueries(total)
                .slowQueries(slow)
                .n1Detections(n1)
                .avgDurationMs(avg != null ? avg : 0.0)
                .p95DurationMs(p95)
                .build();
    }

    private long executeCount(String jpql, UUID appId, LocalDate from, LocalDate to) {
        Long count = (Long) entityManager.createQuery(jpql)
                .setParameter("appId", appId)
                .setParameter("from", from.atStartOfDay().toInstant(java.time.ZoneOffset.UTC))
                .setParameter("to", to.plusDays(1).atStartOfDay().toInstant(java.time.ZoneOffset.UTC))
                .getSingleResult();
        return count != null ? count : 0L;
    }

    private List<DailyStatDTO> getDailyStats(UUID appId, LocalDate from, LocalDate to) {
        String nativeQuery = "SELECT DATE(captured_at) as date, " +
                             "COUNT(*) as total, " +
                             "SUM(CASE WHEN status='SLOW' THEN 1 ELSE 0 END) as slow, " +
                             "AVG(duration_ms) as avg_ms " +
                             "FROM query_logs " +
                             "WHERE app_id = :appId " +
                             "AND captured_at >= :from AND captured_at < :to " +
                             "GROUP BY DATE(captured_at) " +
                             "ORDER BY date ASC";

        List<Object[]> results = entityManager.createNativeQuery(nativeQuery)
                .setParameter("appId", appId)
                .setParameter("from", from.atStartOfDay().toInstant(java.time.ZoneOffset.UTC))
                .setParameter("to", to.plusDays(1).atStartOfDay().toInstant(java.time.ZoneOffset.UTC))
                .getResultList();

        List<DailyStatDTO> dailyStats = new ArrayList<>();
        for (Object[] row : results) {
            String dateStr = row[0].toString();
            long total = ((Number) row[1]).longValue();
            long slow = row[2] != null ? ((Number) row[2]).longValue() : 0L;
            double avgMs = row[3] != null ? ((Number) row[3]).doubleValue() : 0.0;
            dailyStats.add(new DailyStatDTO(dateStr, total, slow, avgMs));
        }
        return dailyStats;
    }
}
