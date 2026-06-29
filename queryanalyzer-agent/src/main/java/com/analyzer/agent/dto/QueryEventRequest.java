package com.analyzer.agent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QueryEventRequest {
    private String sqlText;
    private String operation;
    private String tableName;
    private long durationMs;
    private int rowCount;
    private String callerClass;
    private String callerMethod;
    private String capturedAt;
}
