package com.queryanalyzer.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ExecutionPlanDTO {
    private UUID id;
    private String planJson;
    private String scanType;
    private Long rowsScanned;
    private BigDecimal startupCost;
    private BigDecimal totalCost;
    private Instant analyzedAt;
}
