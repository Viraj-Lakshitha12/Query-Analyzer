package com.queryanalyzer.backend.service;

import com.queryanalyzer.backend.domain.AlertRule;
import com.queryanalyzer.backend.domain.App;
import com.queryanalyzer.backend.dto.AlertRuleDTO;
import com.queryanalyzer.backend.dto.AlertRuleRequest;
import com.queryanalyzer.backend.repository.AlertRuleRepository;
import com.queryanalyzer.backend.repository.AppRepository;
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
@Transactional
public class AlertRuleService {

    private final AlertRuleRepository alertRuleRepository;
    private final AppRepository appRepository;

    public List<AlertRuleDTO> listRules(UUID appId) {
        return alertRuleRepository.findByAppId(appId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public AlertRuleDTO createRule(UUID appId, AlertRuleRequest request) {
        App app = appRepository.findById(appId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "App not found"));

        AlertRule rule = AlertRule.builder()
                .app(app)
                .metric(request.getMetricName())
                .thresholdValue(request.getThresholdValue())
                .channel(request.getChannel())
                .emailAddress(request.getEmailAddress())
                .active(request.isActive())
                .build();

        return toDTO(alertRuleRepository.save(rule));
    }

    public AlertRuleDTO updateRule(UUID ruleId, UUID appId, AlertRuleRequest request) {
        AlertRule rule = alertRuleRepository.findById(ruleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rule not found"));

        if (!rule.getApp().getId().equals(appId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rule does not belong to app");
        }

        rule.setMetric(request.getMetricName());
        rule.setThresholdValue(request.getThresholdValue());
        rule.setChannel(request.getChannel());
        rule.setEmailAddress(request.getEmailAddress());
        rule.setActive(request.isActive());

        return toDTO(alertRuleRepository.save(rule));
    }

    public void deleteRule(UUID ruleId, UUID appId) {
        AlertRule rule = alertRuleRepository.findById(ruleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rule not found"));
        if (!rule.getApp().getId().equals(appId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rule does not belong to app");
        }
        alertRuleRepository.delete(rule);
    }

    private AlertRuleDTO toDTO(AlertRule rule) {
        return AlertRuleDTO.builder()
                .id(rule.getId())
                .metricName(rule.getMetric())
                .thresholdValue(rule.getThresholdValue())
                .channel(rule.getChannel())
                .emailAddress(rule.getEmailAddress())
                .active(rule.isActive())
                .build();
    }
}
