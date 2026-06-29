package com.queryanalyzer.backend.controller;

import com.queryanalyzer.backend.domain.QueryIssue;
import com.queryanalyzer.backend.dto.QueryDetailDTO;
import com.queryanalyzer.backend.dto.QueryIssueDTO;
import com.queryanalyzer.backend.dto.QueryLogDTO;
import com.queryanalyzer.backend.dto.QueryLogFilter;
import com.queryanalyzer.backend.repository.QueryIssueRepository;
import com.queryanalyzer.backend.service.AiExplanationService;
import com.queryanalyzer.backend.service.AppService;
import com.queryanalyzer.backend.service.QueryLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/apps/{appId}/queries")
@RequiredArgsConstructor
public class QueryLogController {

    private final QueryLogService queryLogService;
    private final AppService appService;
    private final AiExplanationService aiExplanationService;
    private final QueryIssueRepository queryIssueRepository;

    @GetMapping
    public Page<QueryLogDTO> listQueries(
            @PathVariable UUID appId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer minDurationMs,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean hasIssues,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        
        // Verify user owns this app
        appService.getApp(appId, extractUserId(auth));

        QueryLogFilter filter = new QueryLogFilter(status, minDurationMs, from, to, search, hasIssues);
        return queryLogService.getQueryLogs(appId, filter,
                PageRequest.of(page, size, Sort.by("capturedAt").descending()));
    }

    @GetMapping("/slow")
    public List<QueryLogDTO> topSlow(@PathVariable UUID appId, Authentication auth) {
        appService.getApp(appId, extractUserId(auth));
        return queryLogService.getTopSlowQueries(appId, 20);
    }

    @GetMapping("/{queryId}")
    public QueryDetailDTO getDetail(@PathVariable UUID appId,
                                    @PathVariable UUID queryId,
                                    Authentication auth) {
        appService.getApp(appId, extractUserId(auth));
        return queryLogService.getQueryDetail(queryId, appId);
    }

    @PostMapping("/{queryId}/issues/{issueId}/explain-ai")
    public QueryIssueDTO explainAi(@PathVariable UUID appId,
                                   @PathVariable UUID queryId,
                                   @PathVariable UUID issueId,
                                   Authentication auth) {
        appService.getApp(appId, extractUserId(auth));

        QueryIssue issue = queryIssueRepository.findById(issueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Issue not found"));

        if (!issue.getQueryLog().getId().equals(queryId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Issue does not belong to this query");
        }

        QueryIssue explainedIssue = aiExplanationService.explain(issueId);

        return QueryIssueDTO.builder()
                .id(explainedIssue.getId())
                .issueType(explainedIssue.getIssueType())
                .severity(explainedIssue.getSeverity())
                .ruleSuggestion(explainedIssue.getRuleSuggestion())
                .aiSuggestion(explainedIssue.getAiSuggestion())
                .aiEnhanced(explainedIssue.isAiEnhanced())
                .resolved(explainedIssue.isResolved())
                .createdAt(explainedIssue.getCreatedAt())
                .build();
    }

    private UUID extractUserId(Authentication auth) {
        return UUID.fromString(auth.getPrincipal().toString());
    }
}
