package com.analyzer.agent.queue;

import com.analyzer.agent.config.QueryAnalyzerProperties;
import com.analyzer.agent.dto.BatchIngestRequest;
import com.analyzer.agent.dto.QueryEventRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * EventQueueManager
 * ──────────────────
 * Non-blocking batch queue that decouples the AOP interceptor from network I/O.
 *
 * Design goals:
 *   1. offer() is O(1) and NEVER blocks the target application's threads
 *   2. A daemon thread flushes the queue periodically or when batchSize is reached
 *   3. Network failures are swallowed silently — the agent must never crash the host app
 *   4. Clean shutdown drains remaining events on application stop
 *
 * Data flow:
 *   QueryMonitorAspect → offer(event) → [ArrayBlockingQueue] → flush() → POST /api/v1/ingest/batch
 */
@Slf4j
public class EventQueueManager implements DisposableBean {

    private final ArrayBlockingQueue<QueryEventRequest> queue;
    private final ScheduledExecutorService scheduler;
    private final RestTemplate restTemplate;
    private final QueryAnalyzerProperties properties;
    private final String ingestUrl;

    public EventQueueManager(QueryAnalyzerProperties properties, RestTemplate restTemplate) {
        this.properties = properties;
        this.restTemplate = restTemplate;
        this.ingestUrl = properties.getServerUrl().replaceAll("/+$", "") + "/api/v1/ingest/batch";

        // Fixed-capacity queue
        this.queue = new ArrayBlockingQueue<>(properties.getQueueCapacity());

        // Single daemon thread for flushing
        this.scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "queryanalyzer-flush");
            t.setDaemon(true);
            return t;
        });

        // Schedule periodic flush
        this.scheduler.scheduleAtFixedRate(
                this::flush,
                properties.getFlushIntervalMs(),
                properties.getFlushIntervalMs(),
                TimeUnit.MILLISECONDS
        );

        log.info("QueryAnalyzer agent initialized — queue capacity={}, batchSize={}, flushInterval={}ms, target={}",
                properties.getQueueCapacity(), properties.getBatchSize(),
                properties.getFlushIntervalMs(), ingestUrl);
    }

    /**
     * Add an event to the queue. O(1), non-blocking.
     * If the queue is full, the event is silently dropped.
     *
     * @param event the intercepted query event
     */
    public void offer(QueryEventRequest event) {
        if (!queue.offer(event)) {
            log.trace("QueryAnalyzer queue full — dropping event: {}.{}",
                    event.getCallerClass(), event.getCallerMethod());
        }

        // If we've accumulated enough events, trigger an immediate flush
        if (queue.size() >= properties.getBatchSize()) {
            scheduler.execute(this::flush);
        }
    }

    /**
     * Drain up to batchSize events from the queue and POST them to the backend.
     * Called periodically by the scheduler and on-demand when batchSize is reached.
     */
    private void flush() {
        try {
            if (queue.isEmpty()) return;

            List<QueryEventRequest> events = new ArrayList<>(properties.getBatchSize());
            queue.drainTo(events, properties.getBatchSize());

            if (events.isEmpty()) return;
            
            BatchIngestRequest batch = new BatchIngestRequest(events);

            // Build request with SDK key header
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (properties.getSdkKey() != null && !properties.getSdkKey().isBlank()) {
                headers.set("X-SDK-Key", properties.getSdkKey());
            }

            HttpEntity<BatchIngestRequest> request = new HttpEntity<>(batch, headers);

            restTemplate.postForEntity(ingestUrl, request, String.class);

            log.debug("QueryAnalyzer flushed {} events to {}", events.size(), ingestUrl);

        } catch (Exception e) {
            // CRITICAL: Never let a flush failure propagate — the target app must not be affected
            log.error("QueryAnalyzer flush failed (non-fatal): {} - events may be lost", e.getMessage(), e);
        }
    }

    /**
     * Clean shutdown — flush remaining events and stop the scheduler.
     */
    @Override
    public void destroy() {
        log.info("QueryAnalyzer agent shutting down — flushing remaining events...");

        scheduler.shutdown();
        try {
            // Give remaining events a chance to flush
            if (!scheduler.awaitTermination(5, TimeUnit.SECONDS)) {
                scheduler.shutdownNow();
            }
        } catch (InterruptedException e) {
            scheduler.shutdownNow();
            Thread.currentThread().interrupt();
        }

        // Final flush of any remaining events
        flush();

        log.info("QueryAnalyzer agent shutdown complete. Queue remaining: {}", queue.size());
    }
}
