package com.queryanalyzer.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class AlertRuleDTO {
    private UUID id;
    private String metricName;
    private int thresholdValue;
    private String channel;
    private String webhookUrl;
    private String emailAddress;
    private boolean active;
}
