package com.queryanalyzer.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateAppRequest {
    @NotBlank
    private String name;

    @NotBlank
    private String environment; // DEV | STAGING | PROD

    private int slowQueryThresholdMs = 200;
}
