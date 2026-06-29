package com.queryanalyzer.backend.controller;

import com.queryanalyzer.backend.dto.AnalyticsDTO;
import com.queryanalyzer.backend.service.AnalyticsService;
import com.queryanalyzer.backend.service.AppService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/apps/{appId}/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final AppService appService;

    @GetMapping
    public AnalyticsDTO getAnalytics(
            @PathVariable UUID appId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            Authentication auth) {
        appService.getApp(appId, extractUserId(auth));
        return analyticsService.getAnalytics(appId, from, to);
    }

    private UUID extractUserId(Authentication auth) {
        return UUID.fromString(auth.getPrincipal().toString());
    }
}
