package com.queryanalyzer.backend.service;

import com.queryanalyzer.backend.domain.QueryIssue;
import com.queryanalyzer.backend.dto.N1PatternDTO;
import com.queryanalyzer.backend.dto.QueryIssueDTO;
import com.queryanalyzer.backend.repository.QueryIssueRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
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
public class IssueService {

    private final QueryIssueRepository queryIssueRepository;
    private final EntityManager entityManager;

    public List<QueryIssueDTO> getIssues(UUID appId, String severity, String issueType, Boolean resolved) {
        String jpql = "SELECT qi FROM QueryIssue qi JOIN qi.queryLog ql WHERE ql.app.id = :appId " +
                      "AND (:severity IS NULL OR qi.severity = :severity) " +
                      "AND (:issueType IS NULL OR qi.issueType = :issueType) " +
                      "AND (:resolved IS NULL OR qi.resolved = :resolved) " +
                      "ORDER BY qi.createdAt DESC";

        List<QueryIssue> issues = entityManager.createQuery(jpql, QueryIssue.class)
                .setParameter("appId", appId)
                .setParameter("severity", severity)
                .setParameter("issueType", issueType)
                .setParameter("resolved", resolved)
                .getResultList();

        return issues.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<N1PatternDTO> getN1Patterns(UUID appId) {
        String jpql = "SELECT ql.sqlHash, MIN(ql.sqlText), ql.tableName, COUNT(qi) FROM QueryIssue qi " +
                      "JOIN qi.queryLog ql " +
                      "WHERE ql.app.id = :appId AND qi.issueType = 'N_PLUS_ONE' " +
                      "GROUP BY ql.sqlHash, ql.tableName " +
                      "ORDER BY COUNT(qi) DESC";

        List<Object[]> results = entityManager.createQuery(jpql, Object[].class)
                .setParameter("appId", appId)
                .getResultList();

        return results.stream()
                .map(row -> N1PatternDTO.builder()
                        .sqlHash((String) row[0])
                        .pattern(truncate((String) row[1], 120))
                        .tableName((String) row[2])
                        .occurrences((Long) row[3])
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public QueryIssueDTO markResolved(UUID issueId) {
        QueryIssue issue = queryIssueRepository.findById(issueId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Issue not found"));
        issue.setResolved(true);
        issue = queryIssueRepository.save(issue);
        return toDTO(issue);
    }

    private QueryIssueDTO toDTO(QueryIssue issue) {
        return QueryIssueDTO.builder()
                .id(issue.getId())
                .issueType(issue.getIssueType())
                .severity(issue.getSeverity())
                .ruleSuggestion(issue.getRuleSuggestion())
                .aiSuggestion(issue.getAiSuggestion())
                .aiEnhanced(issue.isAiEnhanced())
                .resolved(issue.isResolved())
                .createdAt(issue.getCreatedAt())
                .build();
    }

    private String truncate(String s, int max) {
        return s != null && s.length() > max ? s.substring(0, max) + "..." : s;
    }
}
