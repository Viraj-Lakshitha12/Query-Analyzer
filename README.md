<div align="center">
  <h1>🚀 QueryAnalyzer</h1>
  <p><b>Advanced Real-Time Database Performance Monitoring & AI-Powered Optimization</b></p>
  
  <p>
    <b>Course:</b> BSc (Hons) Applied Computing — COM646 Final Year Project<br>
    <b>Institution:</b> Glyndŵr University / Wrexham University<br>
    <b>Year:</b> 2026
  </p>
</div>

---

## 📖 Overview

**Query Analyzer** is a modern, enterprise-grade performance monitoring tool designed specifically for Spring Boot and Hibernate applications. It acts as a transparent proxy at the JDBC layer, intercepting and analyzing every SQL query your application executes in real-time.

Instead of just logging slow queries, Query Analyzer actively detects deep architectural flaws like **N+1 Query Patterns**, **Missing Indexes**, and **Sequential Scans**, and uses **Google Gemini AI** to generate actionable, human-readable execution plan optimizations.

## ✨ Core Capabilities

*   🔥 **Zero-Code Instrumentation**: Automatically intercepts queries via a custom DataSource Proxy without requiring changes to your application's business logic.
*   🧠 **AI-Powered Diagnostics**: Integrates with Google Gemini to analyze PostgreSQL `EXPLAIN` plans and suggest exact SQL or indexing strategies to fix bottlenecks.
*   🕵️‍♂️ **Intelligent Anti-Pattern Detection**:
    *   **N+1 Queries**: Uses a sliding time-window algorithm to detect repetitive, redundant query fetching.
    *   **Slow Queries**: Flags queries exceeding custom latency thresholds.
    *   **Missing Indexes**: Identifies unoptimized full table scans.
*   🚨 **Automated Alerting Engine**: Configure custom threshold rules (e.g., *2 Critical Issues in 1 minute*). Receives beautifully formatted, real-time HTML email notifications.
*   📊 **Live React Dashboard**: A sleek, modern Vite + TailwindCSS frontend providing real-time data streaming via WebSockets, historical metrics, and visual performance charts.
*   🔐 **Multi-Tenant SDK Keys**: Securely monitor multiple microservices or applications from a single centralized Query Analyzer dashboard.

---

## 🛠️ Tech Stack
Java 17 · Spring Boot 3 · PostgreSQL · Redis · React · Vite · Tailwind · STOMP · Google Gemini

---

## 📁 Repository Structure

```text
query-analyzer/
├── backend/              # Spring Boot analysis engine & central hub
├── queryanalyzer-frontend/    # React + Vite live dashboard
├── queryanalyzer-agent/       # Java agent library for query interception
├── sample-target-app/    # Demo Spring Boot app with planted anti-patterns
├── docker-compose.yml    # PostgreSQL and Redis containers
└── README.md
```

---

## 🏗️ System Architecture

The ecosystem consists of four main components:

1.  **Backend (Central Hub)**: A Spring Boot application managing the REST APIs, WebSocket streams, Alert Engine, PostgreSQL database, and Redis cache. See [backend/README.md](backend/README.md) for detailed setup.
2.  **Frontend (Dashboard)**: A React/Vite application for data visualization and rule management. See [queryanalyzer-frontend/README.md](queryanalyzer-frontend/README.md) for detailed setup.
3.  **Agent Library**: A Java agent library for intercepting SQL queries in Spring Boot applications. See [queryanalyzer-agent/README.md](queryanalyzer-agent/README.md) for integration instructions.
4.  **Sample Target App**: A demo Spring Boot application with planted performance anti-patterns for testing. See [sample-target-app/README.md](sample-target-app/README.md) for demo endpoints.

---

## 🚀 Getting Started (Setting up the Dashboard)

Follow these steps to run the Query Analyzer Hub on your local machine.

### Prerequisites & Default Ports

| Service | Port |
| :--- | :--- |
| Backend | `8080` |
| Frontend | `5173` |
| Sample App | `8081` |
| PostgreSQL | `5433` |
| Redis | `6379` |

### 1. Start Infrastructure (Docker Compose)

Start PostgreSQL and Redis using Docker Compose:
```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5433
- Redis on port 6379

The database `analyzer_db` will be created automatically by Flyway migrations.

### 2. Configure Backend

Configure email and AI settings in `backend/src/main/resources/application.yaml`:

```yaml
spring:
  mail:
    username: your_email@gmail.com
    password: your_16_char_google_app_password

queryanalyzer:
  ai:
    gemini:
      api-key: your_google_gemini_api_key
```

*Note: Google Gemini and Email Alerting are optional. Without a Gemini key, the system gracefully falls back to rule-based advice only. Without a mail password, alerts are still generated in the backend but the email sending is skipped.*

### 3. Start the Backend Server
```bash
cd backend
./mvnw spring-boot:run
```
*Flyway will automatically execute database migrations on startup.*

### 4. Start the Frontend Dashboard
```bash
cd queryanalyzer-frontend
npm install
npm run dev
```
*(No authentication is required for local dashboard access).*

---

## 🔌 Integrating Query Analyzer into YOUR Application

Want to monitor your own Spring Boot project? 

**Step 1: Get an SDK Key**
Open the Frontend Dashboard (`http://localhost:5173`), go to **Applications**, and click **"Create App"**. Copy the generated `SDK Key`.

**Step 2: Add the Agent Dependency to your `pom.xml`**

```xml
<dependency>
    <groupId>com.queryanalyzer</groupId>
    <artifactId>queryanalyzer-agent</artifactId>
    <version>1.0.0-SNAPSHOT</version>
</dependency>
```

**Step 3: Add the Configuration to your app's `application.yml`**

```yaml
queryanalyzer:
  enabled: true
  sdk-key: "ql_live_YOUR_GENERATED_SDK_KEY"
  server-url: http://localhost:8080   # The URL of your Query Analyzer Backend
  batch-size: 10
  flush-interval-ms: 500
  queue-capacity: 1000
```

That's it! Restart your application, and its queries will instantly stream into the live dashboard.

---

## 🧪 Running the Demo (Sample App)

If you just want to test the capabilities without integrating it into your own app, run the included **Sample Target App**.

### 1. Start the Sample App
```bash
cd sample-target-app
./mvnw spring-boot:run
```

### 2. Trigger Performance Issues
Open your browser and hit these mock endpoints to generate real performance alerts:

*   **Trigger a Slow Query (300ms database sleep):**
    `http://localhost:8081/demo/slow/guaranteed-slow`
*   **Trigger an N+1 Database Issue (Executes 15 sequential queries):**
    `http://localhost:8081/demo/slow/orders-by-city`
*   **Simulate Load (Mixed fast & slow queries):**
    Send a `POST` request to `http://localhost:8081/demo/load-test/mixed?iterations=50`

---

## 🔧 Troubleshooting

*   **No queries appearing:** Check that the `sdk-key` and `server-url` are correct in the target app, and verify that Redis is running.
*   **EXPLAIN missing:** The Backend must be able to reach the same PostgreSQL instance (or a replica) to run the `EXPLAIN` command.
*   **AI panel empty:** Ensure `queryanalyzer.ai.gemini.api-key` is set; otherwise, only rule-based text is shown.

## 📈 Evaluation Highlights

*   **Primary detection accuracy:** 100% (30 planted scenarios).
*   **Agent overhead:** +0.2 ms absolute (target ≤ 0.5 ms).
*   **Zero business-code changes required.**

---
