package com.queryanalyzer.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.queryanalyzer.backend.domain.QueryIssue;
import com.queryanalyzer.backend.repository.QueryIssueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Uses Gemini API to explain PostgreSQL performance issues.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiExplanationService {

    private final QueryIssueRepository issueRepository;
    private final ObjectMapper objectMapper;

    @Value("${queryanalyzer.ai.gemini.api-key:mock_key}")
    private String geminiApiKey;

    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=";

    /**
     * Called when the developer clicks "Explain with AI" in the dashboard.
     * Populates ai_suggestion on the QueryIssue and sets ai_enhanced = true.
     */
    public QueryIssue explain(UUID issueId) {
        QueryIssue issue = issueRepository.findById(issueId)
            .orElseThrow(() -> new RuntimeException("Issue not found: " + issueId));

        if (issue.getAiSuggestion() != null && !issue.getAiSuggestion().isBlank()) {
            return issue; // already explained — return cached result
        }

        String sqlText = issue.getQueryLog().getSqlText();
        String issueType = issue.getIssueType();
        String ruleSuggestion = issue.getRuleSuggestion();

        String prompt = String.format(
            "You are an expert PostgreSQL database administrator. " +
            "Analyze the following query and the detected performance issue.\n\n" +
            "Query:\n%s\n\n" +
            "Detected Issue: %s\n" +
            "Rule Suggestion: %s\n\n" +
            "Provide a concise, plain English explanation of why this happens and give a concrete, actionable fix (e.g., specific SQL to add an index, or how to rewrite the query). Keep it under 150 words.",
            sqlText, issueType, ruleSuggestion
        );

        String aiResponseText;

        if ("mock_key".equals(geminiApiKey) || geminiApiKey.isBlank()) {
            aiResponseText = "AI Explanation (Mock Mode): This query is experiencing a " + issueType + ". " + ruleSuggestion + " To fix this, you should optimize the query structure or add appropriate indexes to reduce the cost.";
            log.warn("Using mock Gemini API response because GEMINI_API_KEY is not set.");
        } else {
            try {
                RestTemplate restTemplate = new RestTemplate();
                
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                
                Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                        Map.of(
                            "parts", List.of(
                                Map.of("text", prompt)
                            )
                        )
                    )
                );
                
                HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
                String responseJson = restTemplate.postForObject(GEMINI_API_URL + geminiApiKey, request, String.class);
                
                JsonNode root = objectMapper.readTree(responseJson);
                aiResponseText = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
                
            } catch (Exception e) {
                log.error("Failed to fetch AI explanation from Gemini", e);
                aiResponseText = "AI analysis failed: " + e.getMessage();
            }
        }

        issue.setAiSuggestion(aiResponseText);
        issue.setAiEnhanced(true);
        return issueRepository.save(issue);
    }
}
