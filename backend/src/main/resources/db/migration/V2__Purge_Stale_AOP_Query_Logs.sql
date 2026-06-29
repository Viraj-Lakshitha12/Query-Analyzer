-- V2: Remove stale query logs that were inserted by the old pure Spring-AOP aspect.
-- Those rows have sql_text starting with "sql unavailable in pure spring aop without datasource-proxy".
-- All associated child records (query_issues, execution_plans) must be deleted first due to FK constraints.

-- 1. Delete execution_plans referencing the stale query_logs
DELETE FROM execution_plans
WHERE query_log_id IN (
    SELECT id FROM query_logs
    WHERE LOWER(sql_text) LIKE '%sql unavailable%'
);

-- 2. Delete query_issues referencing the stale query_logs
DELETE FROM query_issues
WHERE query_log_id IN (
    SELECT id FROM query_logs
    WHERE LOWER(sql_text) LIKE '%sql unavailable%'
);

-- 3. Delete the stale query_logs themselves
DELETE FROM query_logs
WHERE LOWER(sql_text) LIKE '%sql unavailable%';
