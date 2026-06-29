package com.queryanalyzer.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class AppDTO {
    private UUID id;
    private String name;
    private String sdkKey;
    private String environment;
    private int slowQueryThresholdMs;
    private boolean active;
    private Instant createdAt;
}
