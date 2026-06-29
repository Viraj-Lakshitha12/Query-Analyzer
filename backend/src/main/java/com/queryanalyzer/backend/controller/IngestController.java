package com.queryanalyzer.backend.controller;

import com.queryanalyzer.backend.dto.BatchIngestRequest;
import com.queryanalyzer.backend.dto.QueryEventRequest;
import com.queryanalyzer.backend.service.IngestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ingest")
@RequiredArgsConstructor
public class IngestController {

    private final IngestService ingestService;

    @PostMapping("/batch")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void ingestBatch(@RequestBody BatchIngestRequest request) {
        UUID appId = extractAppId();
        ingestService.processBatchAsync(appId, request.getEvents());
    }

    @PostMapping("/query")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void ingestSingle(@RequestBody QueryEventRequest request) {
        UUID appId = extractAppId();
        ingestService.processBatchAsync(appId, List.of(request));
    }

    private UUID extractAppId() {
        // SdkKeyAuthFilter stored appId as the authentication principal
        return UUID.fromString(
                SecurityContextHolder.getContext()
                        .getAuthentication().getPrincipal().toString()
        );
    }
}
