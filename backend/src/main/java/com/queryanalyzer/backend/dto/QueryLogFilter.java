package com.queryanalyzer.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class QueryLogFilter {
    private String status;
    private Integer minDurationMs;
    private Instant from;
    private Instant to;
    private String search;
    private Boolean hasIssues;
}
