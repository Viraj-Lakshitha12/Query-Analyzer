package com.queryanalyzer.backend.websocket;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class QueryEventWsDTO {
    private UUID id;
    private String sqlText;
    private int durationMs;
    private String status;
    private String tableName;
    private Instant capturedAt;
}
