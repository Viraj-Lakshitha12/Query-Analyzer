package com.queryanalyzer.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class QueryLogDTO {
    private UUID id;
    private String sqlText;
    private String sqlHash;
    private int durationMs;
    private String queryType;
    private String tableName;
    private String status;
    private int issueCount;
    private Instant capturedAt;
    private String callerClass;
    private String callerMethod;
}
