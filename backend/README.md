# Query Analyzer Backend

Spring Boot backend service for the Query Analyzer performance monitoring system.

## Overview

The backend is the central hub that:
- Receives query events from monitored applications via REST API
- Analyzes SQL queries for performance issues (slow queries, N+1 patterns, missing indexes)
- Stores query logs, execution plans, and detected issues in PostgreSQL
- Provides WebSocket streams for real-time dashboard updates
- Evaluates alert rules and sends email notifications
- Integrates with Google Gemini AI for intelligent query optimization suggestions

## Tech Stack

- Java 17
- Spring Boot 3.2.0
- Spring Data JPA
- PostgreSQL (port 5433)
- Redis (port 6379)
- Spring Boot Mail (for email alerts)
- Google Gemini AI API
- WebSocket (STOMP)

## Configuration

### Database & Cache

Configure in `src/main/resources/application.yaml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5433/analyzer_db
    username: postgres
    password: your_db_password
  data:
    redis:
      host: localhost
      port: 6379
```

### Email Configuration (for Alert Rules)

```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: your.email@gmail.com
    password: your_16_char_app_password
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
```

### AI Configuration

```yaml
queryanalyzer:
  ai:
    gemini:
      api-key: your_google_gemini_api_key
```

*Note: Without a Gemini API key, the system falls back to rule-based advice only.*

## Running the Backend

```bash
cd backend
./mvnw spring-boot:run
```

The backend will start on port 8080.

Flyway migrations will automatically execute on startup to create the database schema.

## API Endpoints

### Ingest API (SDK Key Authenticated)

- `POST /api/v1/ingest/query` - Submit a single query event
- `POST /api/v1/ingest/batch` - Submit multiple query events

Headers: `X-SDK-Key: your-sdk-key`

### Auth API

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login (sets HttpOnly JWT cookie)
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user

### Query Management

- `GET /api/v1/queries` - List query logs with filtering
- `GET /api/v1/queries/{id}` - Get query details with execution plan
- `GET /api/v1/queries/{id}/explain-ai` - Get AI-powered explanation

### Alert Rules

- `GET /api/v1/alert-rules` - List alert rules for an app
- `POST /api/v1/alert-rules` - Create alert rule
- `PUT /api/v1/alert-rules/{id}` - Update alert rule
- `DELETE /api/v1/alert-rules/{id}` - Delete alert rule

## Database Schema

- `users` - User accounts
- `apps` - Monitored applications with SDK keys
- `query_logs` - Captured SQL queries
- `execution_plans` - EXPLAIN plan analysis
- `query_issues` - Detected performance issues
- `alert_rules` - Alert configuration

## Detection Logic

### Slow Query Detection

Queries exceeding the app's `slowQueryThresholdMs` (default: 200ms) are flagged as SLOW.

### N+1 Pattern Detection

Uses a sliding time-window algorithm in Redis:
- Normalizes SQL queries
- Counts occurrences within a time window (default: 500ms)
- Flags when count exceeds threshold (default: 10)

### Missing Index Detection

Analyzes execution plans for sequential scans on large tables.

## Alert Evaluation

Scheduled job runs every minute to:
- Check configured alert rules
- Count critical issues, slow queries, average duration
- Send email notifications when thresholds are exceeded
- Respects cooldown period to prevent spam

## Testing

Run integration tests:

```bash
./mvnw test
```

Run specific test:

```bash
./mvnw test -Dtest=DetectionAccuracyTest
```

## Port

- Backend API: 8080
