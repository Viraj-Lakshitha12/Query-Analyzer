-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    full_name     VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'USER',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Apps table
CREATE TABLE apps (
    id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_id                UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                    VARCHAR(100) NOT NULL,
    sdk_key                 VARCHAR(64)  NOT NULL UNIQUE,
    environment             VARCHAR(20)  NOT NULL DEFAULT 'DEV',
    slow_query_threshold_ms INT          NOT NULL DEFAULT 200,
    active                  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_apps_sdk_key  ON apps(sdk_key);
CREATE INDEX idx_apps_owner_id ON apps(owner_id);

-- Query logs table
CREATE TABLE query_logs (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    app_id        UUID         NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    sql_text      TEXT         NOT NULL,
    sql_hash      VARCHAR(64)  NOT NULL,
    duration_ms   INT          NOT NULL,
    query_type    VARCHAR(10),
    table_name    VARCHAR(100),
    status        VARCHAR(10)  NOT NULL DEFAULT 'FAST',
    captured_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Partial index — only SLOW/N1 matter for the dashboard (FAST = majority, skip them)
CREATE INDEX idx_query_logs_app_status
    ON query_logs(app_id, status)
    WHERE status != 'FAST';

CREATE INDEX idx_query_logs_hash  ON query_logs(sql_hash);
CREATE INDEX idx_query_logs_time  ON query_logs(app_id, captured_at DESC);

-- Execution plans table
CREATE TABLE execution_plans (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query_log_id  UUID NOT NULL UNIQUE REFERENCES query_logs(id) ON DELETE CASCADE,
    plan_json     JSONB,
    scan_type     VARCHAR(30),
    rows_scanned  BIGINT,
    startup_cost  NUMERIC(12,4),
    total_cost    NUMERIC(12,4),
    analyzed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Query issues table
CREATE TABLE query_issues (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    query_log_id    UUID        NOT NULL REFERENCES query_logs(id) ON DELETE CASCADE,
    issue_type      VARCHAR(30) NOT NULL,
    severity        VARCHAR(10) NOT NULL,
    rule_suggestion TEXT,
    ai_suggestion   TEXT,
    ai_enhanced     BOOLEAN     NOT NULL DEFAULT FALSE,
    resolved        BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_issues_log_id  ON query_issues(query_log_id);
CREATE INDEX idx_issues_unresolved ON query_issues(severity)
    WHERE resolved = FALSE;

-- Alert rules table
CREATE TABLE alert_rules (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    app_id          UUID        NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    metric          VARCHAR(30) NOT NULL,
    threshold_value INT         NOT NULL,
    channel         VARCHAR(20) NOT NULL,
    webhook_url     VARCHAR(500),
    email_address   VARCHAR(255),
    active          BOOLEAN     NOT NULL DEFAULT TRUE,
    last_triggered  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
