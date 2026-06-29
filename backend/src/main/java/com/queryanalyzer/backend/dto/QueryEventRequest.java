package com.queryanalyzer.backend.dto;

import lombok.Data;

import java.time.Instant;

@Data
public class QueryEventRequest {
    private String sqlText;
    private long durationMs;
    private Instant capturedAt;
    private String callerClass;
    private String callerMethod;
}
