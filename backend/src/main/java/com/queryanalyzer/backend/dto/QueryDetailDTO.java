package com.queryanalyzer.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class QueryDetailDTO {
    private UUID id;
    private String sqlText;
    private String sqlHash;
    private int durationMs;
    private String queryType;
    private String tableName;
    private String status;
    private int issueCount;
    private Instant capturedAt;

    private ExecutionPlanDTO executionPlan; // nullable
    private List<QueryIssueDTO> issues;
}
