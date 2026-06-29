package com.queryanalyzer.backend.dto;

import lombok.Data;

@Data
public class AuthRequest {
    private String email;
    private String password;
    private String fullName; // Only used for registration
}
