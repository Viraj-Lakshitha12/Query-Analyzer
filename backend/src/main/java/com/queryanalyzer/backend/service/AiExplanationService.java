package com.queryanalyzer.backend.service;

import com.queryanalyzer.backend.domain.QueryIssue;
import com.queryanalyzer.backend.repository.QueryIssueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Stub implementation — returns a placeholder until the LLM API
 * integration is added in a later sprint (Week 6).
 * The interface is complete so the controller can be wired up now.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiExplanationService {

    private final QueryIssueRepository issueRepository;

    /**
     * Called when the developer clicks "Explain with AI" in the dashboard.
     * Populates ai_suggestion on the QueryIssue and sets ai_enhanced = true.
     * For now returns a placeholder — replace with real LLM call in Week 6.
     */
    public QueryIssue explain(UUID issueId) {
        QueryIssue issue = issueRepository.findById(issueId)
            .orElseThrow(() -> new RuntimeException("Issue not found: " + issueId));

        if (issue.getAiSuggestion() != null && !issue.getAiSuggestion().isBlank()) {
            return issue; // already explained — return cached result
        }

        // TODO Week 6: replace with real LLM API call
        // Prompt: "You are a PostgreSQL expert. Explain this issue in plain English
        //          and give a concrete fix. Issue: " + issue.getRuleSuggestion()
        issue.setAiSuggestion("[AI explanation coming in Week 6 — LLM API integration]");
        issue.setAiEnhanced(true);
        return issueRepository.save(issue);
    }
}
