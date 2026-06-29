package com.queryanalyzer.backend.websocket;

import com.queryanalyzer.backend.domain.App;
import com.queryanalyzer.backend.domain.QueryLog;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class QueryEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public void publishQueryLog(QueryLog queryLog, App app) {
        String topic = "/topic/queries/" + app.getId();
        messagingTemplate.convertAndSend(topic, queryLog);
    }
}
