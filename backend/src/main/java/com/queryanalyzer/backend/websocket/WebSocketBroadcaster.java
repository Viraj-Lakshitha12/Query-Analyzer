package com.queryanalyzer.backend.websocket;

import com.queryanalyzer.backend.domain.QueryIssue;
import com.queryanalyzer.backend.domain.QueryLog;
import com.queryanalyzer.backend.dto.QueryIssueDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketBroadcaster {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastQuery(UUID appId, QueryLog log) {
        QueryEventWsDTO dto = QueryEventWsDTO.builder()
                .id(log.getId())
                .sqlText(truncate(log.getSqlText(), 120))
                .durationMs(log.getDurationMs())
                .status(log.getStatus())
                .tableName(log.getTableName())
                .capturedAt(log.getCapturedAt())
                .build();
        send("/topic/apps/" + appId + "/queries", dto);
    }

    public void broadcastIssue(UUID appId, QueryIssue issue) {
        send("/topic/apps/" + appId + "/issues", toIssueDTO(issue));
    }

    private void send(String dest, Object payload) {
        try {
            messagingTemplate.convertAndSend(dest, payload);
        } catch (Exception e) {
            log.warn("WS broadcast failed to {}: {}", dest, e.getMessage());
        }
    }

    private String truncate(String s, int max) {
        return s != null && s.length() > max ? s.substring(0, max) + "..." : s;
    }

    private QueryIssueDTO toIssueDTO(QueryIssue issue) {
        return QueryIssueDTO.builder()
                .id(issue.getId())
                .issueType(issue.getIssueType())
                .severity(issue.getSeverity())
                .ruleSuggestion(issue.getRuleSuggestion())
                .resolved(issue.isResolved())
                .build();
    }
}
