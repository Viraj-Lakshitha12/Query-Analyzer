package com.analyzer.agent.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * QueryAnalyzerProperties
 * ────────────────────────
 * Configuration properties for the QueryAnalyzer Agent SDK.
 *
 * Target applications configure these in their application.yml:
 *
 *   queryanalyzer:
 *     enabled: true
 *     sdk-key: my-app-key-123
 *     server-url: http://localhost:8090
 *     batch-size: 50
 *     flush-interval-ms: 1000
 *     queue-capacity: 10000
 */
@Data
@ConfigurationProperties(prefix = "queryanalyzer")
public class QueryAnalyzerProperties {

    /**
     * Master switch — must be true to activate interception.
     * Defaults to false so adding the dependency alone does nothing.
     */
    private boolean enabled = false;

    /**
     * SDK key sent in X-SDK-Key header to identify this application.
     */
    private String sdkKey = "";

    /**
     * URL of the QueryAnalyzer backend server.
     */
    private String serverUrl = "http://localhost:8090";

    /**
     * Number of events to accumulate before flushing to the backend.
     */
    private int batchSize = 50;

    /**
     * Maximum time (ms) between flushes, even if batchSize isn't reached.
     */
    private int flushIntervalMs = 1000;

    /**
     * Maximum capacity of the in-memory event queue.
     * If the queue is full, new events are silently dropped (never blocks the target app).
     */
    private int queueCapacity = 10_000;
}
