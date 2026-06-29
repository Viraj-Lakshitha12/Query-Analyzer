package com.queryanalyzer.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class BatchIngestRequest {
    private List<QueryEventRequest> events;
}
