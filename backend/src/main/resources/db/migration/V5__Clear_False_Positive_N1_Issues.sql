-- Clear existing N+1 issues that may have been caused by INSERT statements
-- This is a one-time cleanup to remove false positives from before the SELECT-only filter was added
DELETE FROM query_issues WHERE issue_type = 'N_PLUS_ONE';
