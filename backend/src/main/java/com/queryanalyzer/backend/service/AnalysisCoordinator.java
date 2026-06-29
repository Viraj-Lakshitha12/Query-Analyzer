package com.queryanalyzer.backend.service;

import com.queryanalyzer.backend.domain.QueryLog;
import com.queryanalyzer.backend.repository.QueryLogRepository;
import com.queryanalyzer.backend.websocket.WebSocketBroadcaster;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.UUID;

/**
 * Called by IngestService after a QueryLog is persisted.
 * Runs N+1 detection (always) and EXPLAIN analysis (SLOW only).
 * Both are fast enough to run inline — no extra thread needed here
 * since IngestService is already @Async.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AnalysisCoordinator {

    private final N1DetectionService n1DetectionService;
    private final ExecutionPlanService executionPlanService;
    private final QueryLogRepository queryLogRepository;
    private final WebSocketBroadcaster webSocketBroadcaster;

    public void analyze(QueryLog queryLog) {
        // 1. N+1 check — runs for every query
        n1DetectionService.check(queryLog);

        // 2. Save any status changes made by n1DetectionService
        queryLogRepository.save(queryLog);

        // 3. EXPLAIN — only for slow queries, trigger after commit to avoid FK race condition
        if ("SLOW".equals(queryLog.getStatus())) {
            if (TransactionSynchronizationManager.isActualTransactionActive()) {
                // Register afterCommit hook to run EXPLAIN after transaction commits
                final UUID queryLogId = queryLog.getId();
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        try {
                            executionPlanService.explainById(queryLogId);
                        } catch (Exception e) {
                            log.error("Failed to run EXPLAIN after commit for queryLog={}: {}", queryLogId, e.getMessage());
                        }
                    }
                });
            } else {
                // Fallback if no transaction is active (shouldn't happen in normal flow)
                executionPlanService.explainById(queryLog.getId());
            }
        }

        // 4. Broadcast via WebSocket
        webSocketBroadcaster.broadcastQuery(queryLog.getApp().getId(), queryLog);
        // Note: New issues should ideally be broadcast here too, but since they are
        // saved inside N1DetectionService and ExecutionPlanService, we'd either need to 
        // return them or inject the broadcaster into those services. Let's do it in those services if needed,
        // or just accept query broadcasts for now to keep it simple.
    }
}
