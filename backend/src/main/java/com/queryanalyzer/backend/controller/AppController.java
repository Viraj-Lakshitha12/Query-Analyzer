package com.queryanalyzer.backend.controller;

import com.queryanalyzer.backend.dto.AppDTO;
import com.queryanalyzer.backend.dto.CreateAppRequest;
import com.queryanalyzer.backend.service.AppService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/apps")
@RequiredArgsConstructor
public class AppController {

    private final AppService appService;

    @GetMapping
    public List<AppDTO> listApps(Authentication auth) {
        return appService.getAppsForUser(extractUserId(auth));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AppDTO createApp(@RequestBody @Valid CreateAppRequest request,
                            Authentication auth) {
        return appService.createApp(extractUserId(auth), request);
    }

    @GetMapping("/{appId}")
    public AppDTO getApp(@PathVariable UUID appId, Authentication auth) {
        return appService.getApp(appId, extractUserId(auth));
    }

    @PutMapping("/{appId}")
    public AppDTO updateApp(@PathVariable UUID appId,
                            @RequestBody @Valid CreateAppRequest request,
                            Authentication auth) {
        return appService.updateApp(appId, extractUserId(auth), request);
    }

    @DeleteMapping("/{appId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteApp(@PathVariable UUID appId, Authentication auth) {
        appService.deleteApp(appId, extractUserId(auth));
    }

    @PostMapping("/{appId}/rotate-key")
    public AppDTO rotateKey(@PathVariable UUID appId, Authentication auth) {
        return appService.rotateKey(appId, extractUserId(auth));
    }

    private UUID extractUserId(Authentication auth) {
        return UUID.fromString(auth.getPrincipal().toString());
    }
}
