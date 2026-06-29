package com.queryanalyzer.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class QueryIssueDTO {
    private UUID id;
    private String issueType;
    private String severity;
    private String ruleSuggestion;
    private String aiSuggestion;
    private boolean aiEnhanced;
    private boolean resolved;
    private Instant createdAt;
}
