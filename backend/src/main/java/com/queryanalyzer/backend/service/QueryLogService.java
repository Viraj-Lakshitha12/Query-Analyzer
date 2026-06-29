package com.queryanalyzer.backend.service;

import com.queryanalyzer.backend.domain.ExecutionPlan;
import com.queryanalyzer.backend.domain.QueryIssue;
import com.queryanalyzer.backend.domain.QueryLog;
import com.queryanalyzer.backend.dto.*;
import com.queryanalyzer.backend.repository.ExecutionPlanRepository;
import com.queryanalyzer.backend.repository.QueryIssueRepository;
import com.queryanalyzer.backend.repository.QueryLogRepository;
import com.queryanalyzer.backend.repository.QueryLogSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QueryLogService {

    private final QueryLogRepository queryLogRepository;
    private final ExecutionPlanRepository executionPlanRepository;
    private final QueryIssueRepository queryIssueRepository;

    public Page<QueryLogDTO> getQueryLogs(UUID appId, QueryLogFilter filter, Pageable pageable) {
        return queryLogRepository.findAll(QueryLogSpecification.filterBy(appId, filter), pageable)
                .map(this::toDTO);
    }

    public QueryDetailDTO getQueryDetail(UUID queryLogId, UUID appId) {
        QueryLog queryLog = queryLogRepository.findById(queryLogId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "QueryLog not found"));

        if (!queryLog.getApp().getId().equals(appId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to access this query log");
        }

        ExecutionPlan plan = executionPlanRepository.findByQueryLog_Id(queryLogId).orElse(null);
        List<QueryIssue> issues = queryIssueRepository.findByQueryLog_Id(queryLogId);

        return toDetailDTO(queryLog, plan, issues);
    }

    public List<QueryLogDTO> getTopSlowQueries(UUID appId, int limit) {
        return queryLogRepository.findTop20ByApp_IdOrderByDurationMsDesc(appId).stream()
                .limit(limit)
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private QueryLogDTO toDTO(QueryLog log) {
        return QueryLogDTO.builder()
                .id(log.getId())
                .sqlText(log.getSqlText())
                .sqlHash(log.getSqlHash())
                .durationMs(log.getDurationMs())
                .queryType(log.getQueryType())
                .tableName(log.getTableName())
                .status(log.getStatus())
                .capturedAt(log.getCapturedAt())
                .issueCount(0) // Assuming issueCount is not eagerly fetched for list view, or we can compute if needed
                .callerClass(log.getCallerClass())
                .callerMethod(log.getCallerMethod())
                .build();
    }

    private QueryDetailDTO toDetailDTO(QueryLog log, ExecutionPlan plan, List<QueryIssue> issues) {
        ExecutionPlanDTO planDTO = null;
        if (plan != null) {
            planDTO = ExecutionPlanDTO.builder()
                    .id(plan.getId())
                    .planJson(plan.getPlanJson())
                    .scanType(plan.getScanType())
                    .rowsScanned(plan.getRowsScanned())
                    .startupCost(plan.getStartupCost())
                    .totalCost(plan.getTotalCost())
                    .analyzedAt(plan.getAnalyzedAt())
                    .build();
        }

        List<QueryIssueDTO> issueDTOs = issues.stream()
                .map(issue -> QueryIssueDTO.builder()
                        .id(issue.getId())
                        .issueType(issue.getIssueType())
                        .severity(issue.getSeverity())
                        .ruleSuggestion(issue.getRuleSuggestion())
                        .aiSuggestion(issue.getAiSuggestion())
                        .aiEnhanced(issue.isAiEnhanced())
                        .resolved(issue.isResolved())
                        .createdAt(issue.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return QueryDetailDTO.builder()
                .id(log.getId())
                .sqlText(log.getSqlText())
                .sqlHash(log.getSqlHash())
                .durationMs(log.getDurationMs())
                .queryType(log.getQueryType())
                .tableName(log.getTableName())
                .status(log.getStatus())
                .capturedAt(log.getCapturedAt())
                .issueCount(issues.size())
                .executionPlan(planDTO)
                .issues(issueDTOs)
                .build();
    }
}
