package com.queryanalyzer.backend.config;

/**
 * Custom exception for resource not found scenarios (404 HTTP status)
 */
public class ResourceNotFoundException extends RuntimeException {
    
    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }

    public static ResourceNotFoundException forResource(String resourceType, String identifier) {
        return new ResourceNotFoundException(
                String.format("%s not found: %s", resourceType, identifier)
        );
    }
}
