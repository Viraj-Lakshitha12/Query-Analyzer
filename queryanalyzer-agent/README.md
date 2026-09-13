# Query Analyzer Agent

Java agent library for intercepting and monitoring SQL queries in Spring Boot applications.

## Overview

The Query Analyzer Agent is a zero-code instrumentation library that automatically intercepts JDBC queries in Spring Boot applications. It captures SQL execution details and sends them to the Query Analyzer backend for analysis.

## Tech Stack

- Java 17
- Spring Boot 3
- Spring AOP
- AspectJ
- Maven

## Integration

### 1. Add Dependency

Add the agent as a dependency to your Spring Boot application's `pom.xml`:

```xml
<dependency>
    <groupId>com.queryanalyzer</groupId>
    <artifactId>queryanalyzer-agent</artifactId>
    <version>1.0.0-SNAPSHOT</version>
</dependency>
```

### 2. Configure

Add the following to your `application.yml`:

```yaml
queryanalyzer:
  enabled: true
  sdk-key: "ql_live_YOUR_GENERATED_SDK_KEY"
  server-url: http://localhost:8080
  batch-size: 10
  flush-interval-ms: 500
  queue-capacity: 1000
```

### 3. Get SDK Key

1. Start the Query Analyzer backend and frontend
2. Login to the dashboard at `http://localhost:5173`
3. Go to Applications → Create App
4. Copy the generated SDK Key
5. Paste it into your `application.yml`

## How It Works

The agent uses Spring AOP to intercept JDBC query execution:

1. **Query Interception**: Captures SQL text, execution time, and caller information
2. **Batching**: Queues events and sends them in batches to reduce network overhead
3. **Async Sending**: Uses a background thread to send events without blocking application execution
4. **Error Handling**: Gracefully handles failures without affecting the monitored application

## Configuration Options

| Property | Default | Description |
|----------|---------|-------------|
| `queryanalyzer.enabled` | `true` | Enable/disable the agent |
| `queryanalyzer.sdk-key` | - | Your app's SDK key from the dashboard |
| `queryanalyzer.server-url` | `http://localhost:8080` | Query Analyzer backend URL |
| `queryanalyzer.batch-size` | `10` | Number of events to batch before sending |
| `queryanalyzer.flush-interval-ms` | `500` | Maximum time to wait before flushing batch |
| `queryanalyzer.queue-capacity` | `1000` | Maximum queue size for events |

## Performance Impact

The agent is designed for minimal performance overhead:
- Asynchronous event sending
- Batching to reduce network calls
- No blocking of application threads
- Typical overhead: < 0.5ms per query

## Building

```bash
./mvnw clean install
```

This will install the agent to your local Maven repository.

## Port

The agent does not expose any ports. It sends data to the configured backend URL.
