package com.queryanalyzer.backend.controller;

import com.queryanalyzer.backend.dto.N1PatternDTO;
import com.queryanalyzer.backend.dto.QueryIssueDTO;
import com.queryanalyzer.backend.service.AppService;
import com.queryanalyzer.backend.service.IssueService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/apps/{appId}/issues")
@RequiredArgsConstructor
public class IssueController {

    private final IssueService issueService;
    private final AppService appService;

    @GetMapping
    public List<QueryIssueDTO> listIssues(
            @PathVariable UUID appId,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String issueType,
            @RequestParam(required = false) Boolean resolved,
            Authentication auth) {
        appService.getApp(appId, extractUserId(auth));
        return issueService.getIssues(appId, severity, issueType, resolved);
    }

    @GetMapping("/n1-patterns")
    public List<N1PatternDTO> n1Patterns(@PathVariable UUID appId,
                                         Authentication auth) {
        appService.getApp(appId, extractUserId(auth));
        return issueService.getN1Patterns(appId);
    }

    @PutMapping("/{issueId}/resolve")
    public QueryIssueDTO resolve(@PathVariable UUID appId,
                                 @PathVariable UUID issueId,
                                 Authentication auth) {
        appService.getApp(appId, extractUserId(auth));
        return issueService.markResolved(issueId);
    }

    private UUID extractUserId(Authentication auth) {
        return UUID.fromString(auth.getPrincipal().toString());
    }
}
