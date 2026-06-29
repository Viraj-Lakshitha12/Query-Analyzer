package com.queryanalyzer.backend.controller;

import com.queryanalyzer.backend.dto.AlertRuleDTO;
import com.queryanalyzer.backend.dto.AlertRuleRequest;
import com.queryanalyzer.backend.service.AlertRuleService;
import com.queryanalyzer.backend.service.AppService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/apps/{appId}/alerts")
@RequiredArgsConstructor
public class AlertRuleController {

    private final AlertRuleService alertRuleService;
    private final AppService appService;

    @GetMapping
    public List<AlertRuleDTO> listRules(@PathVariable UUID appId, Authentication auth) {
        appService.getApp(appId, extractUserId(auth));
        return alertRuleService.listRules(appId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AlertRuleDTO createRule(@PathVariable UUID appId,
                                   @RequestBody @Valid AlertRuleRequest request,
                                   Authentication auth) {
        appService.getApp(appId, extractUserId(auth));
        return alertRuleService.createRule(appId, request);
    }

    @PutMapping("/{ruleId}")
    public AlertRuleDTO updateRule(@PathVariable UUID appId,
                                   @PathVariable UUID ruleId,
                                   @RequestBody @Valid AlertRuleRequest request,
                                   Authentication auth) {
        appService.getApp(appId, extractUserId(auth));
        return alertRuleService.updateRule(ruleId, appId, request);
    }

    @DeleteMapping("/{ruleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRule(@PathVariable UUID appId,
                           @PathVariable UUID ruleId,
                           Authentication auth) {
        appService.getApp(appId, extractUserId(auth));
        alertRuleService.deleteRule(ruleId, appId);
    }

    private UUID extractUserId(Authentication auth) {
        return UUID.fromString(auth.getPrincipal().toString());
    }
}
