-- V3: Remove any remaining stale query logs emitted by the old pure Spring-AOP fallback.
-- This makes the UI and issue detection ignore placeholder SQL rows that were persisted earlier.

DELETE FROM execution_plans
WHERE query_log_id IN (
    SELECT id FROM query_logs
    WHERE LOWER(sql_text) LIKE '%sql unavailable%'
);

DELETE FROM query_issues
WHERE query_log_id IN (
    SELECT id FROM query_logs
    WHERE LOWER(sql_text) LIKE '%sql unavailable%'
);

DELETE FROM query_logs
WHERE LOWER(sql_text) LIKE '%sql unavailable%';
