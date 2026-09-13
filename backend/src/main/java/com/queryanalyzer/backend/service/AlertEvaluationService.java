package com.queryanalyzer.backend.service;

import com.queryanalyzer.backend.domain.AlertRule;
import com.queryanalyzer.backend.repository.AlertRuleRepository;
import com.queryanalyzer.backend.repository.QueryIssueRepository;
import com.queryanalyzer.backend.repository.QueryLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertEvaluationService {

    private final AlertRuleRepository alertRuleRepository;
    private final QueryLogRepository queryLogRepository;
    private final QueryIssueRepository queryIssueRepository;
    private final NotificationService notificationService;

    @Value("${queryanalyzer.alert.cooldown-minutes:10}")
    private int cooldownMinutes;

    // Run every minute
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void evaluateAlertRules() {
        log.debug("Evaluating alert rules...");
        
        List<AlertRule> activeRules = alertRuleRepository.findAll().stream()
                .filter(AlertRule::isActive)
                .toList();

        Instant oneMinuteAgo = Instant.now().minus(1, ChronoUnit.MINUTES);
        Instant cooldownLimit = Instant.now().minus(cooldownMinutes, ChronoUnit.MINUTES);

        for (AlertRule rule : activeRules) {
            // Prevent spam: only trigger if it hasn't triggered in the last X minutes
            if (rule.getLastTriggered() != null && rule.getLastTriggered().isAfter(cooldownLimit)) {
                continue;
            }

            try {
                double currentValue = 0;
                boolean triggered = false;

                switch (rule.getMetric()) {
                    case "AVG_DURATION_MS":
                        currentValue = queryLogRepository.getAverageDurationSince(rule.getApp().getId(), oneMinuteAgo);
                        if (currentValue >= rule.getThresholdValue()) {
                            triggered = true;
                        }
                        break;
                    case "SLOW_QUERY_COUNT":
                        currentValue = queryLogRepository.countSlowQueriesSince(rule.getApp().getId(), oneMinuteAgo);
                        if (currentValue >= rule.getThresholdValue()) {
                            triggered = true;
                        }
                        break;
                    case "CRITICAL_ISSUE_COUNT":
                        currentValue = queryIssueRepository.countCriticalIssuesSince(rule.getApp().getId(), oneMinuteAgo);
                        if (currentValue >= rule.getThresholdValue()) {
                            triggered = true;
                        }
                        break;
                    default:
                        log.warn("Unknown metric {} for rule ID {}", rule.getMetric(), rule.getId());
                }

                if (triggered) {
                    log.info("Rule {} triggered. Metric: {}, Threshold: {}, Current Value: {}", 
                            rule.getId(), rule.getMetric(), rule.getThresholdValue(), currentValue);
                    
                    notificationService.dispatchAlert(rule, currentValue);
                    
                    rule.setLastTriggered(Instant.now());
                    alertRuleRepository.save(rule);
                }

            } catch (Exception e) {
                log.error("Failed to evaluate rule {}", rule.getId(), e);
            }
        }
    }
}
