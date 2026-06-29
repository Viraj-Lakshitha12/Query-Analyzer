package com.queryanalyzer.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AlertRuleRequest {
    @NotBlank
    private String metricName;
    @NotNull
    private Integer thresholdValue;
    @NotBlank
    private String channel;
    private String emailAddress;
    private boolean active = true;
}
