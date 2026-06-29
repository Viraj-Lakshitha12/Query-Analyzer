package com.queryanalyzer.backend.service;

import com.queryanalyzer.backend.domain.App;
import com.queryanalyzer.backend.domain.User;
import com.queryanalyzer.backend.dto.AppDTO;
import com.queryanalyzer.backend.dto.CreateAppRequest;
import com.queryanalyzer.backend.repository.AppRepository;
import com.queryanalyzer.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AppService {

    private final AppRepository appRepository;
    private final UserRepository userRepository;
    private final StringRedisTemplate redisTemplate;

    public List<AppDTO> getAppsForUser(UUID userId) {
        return appRepository.findByOwnerIdAndActiveTrue(userId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public AppDTO createApp(UUID userId, CreateAppRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        String sdkKey = "ql_live_" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);

        App app = App.builder()
                .name(request.getName())
                .environment(request.getEnvironment())
                .slowQueryThresholdMs(request.getSlowQueryThresholdMs())
                .sdkKey(sdkKey)
                .owner(user)
                .active(true)
                .createdAt(Instant.now())
                .build();

        app = appRepository.save(app);
        return toDTO(app);
    }

    public AppDTO getApp(UUID appId, UUID userId) {
        return toDTO(loadApp(appId, userId));
    }

    public AppDTO updateApp(UUID appId, UUID userId, CreateAppRequest request) {
        App app = loadApp(appId, userId);
        app.setName(request.getName());
        app.setEnvironment(request.getEnvironment());
        app.setSlowQueryThresholdMs(request.getSlowQueryThresholdMs());
        app = appRepository.save(app);
        return toDTO(app);
    }

    public void deleteApp(UUID appId, UUID userId) {
        App app = loadApp(appId, userId);
        app.setActive(false);
        appRepository.save(app);
    }

    public AppDTO rotateKey(UUID appId, UUID userId) {
        App app = loadApp(appId, userId);
        String oldKey = app.getSdkKey();

        // invalidate old key in Redis
        redisTemplate.delete("sdk:" + oldKey);

        String newKey = "ql_live_" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);
        app.setSdkKey(newKey);
        app = appRepository.save(app);
        return toDTO(app);
    }

    private App loadApp(UUID appId, UUID userId) {
        App app = appRepository.findById(appId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "App not found"));
        if (!app.getOwner().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to access this app");
        }
        return app;
    }

    private AppDTO toDTO(App app) {
        return AppDTO.builder()
                .id(app.getId())
                .name(app.getName())
                .sdkKey(app.getSdkKey())
                .environment(app.getEnvironment())
                .slowQueryThresholdMs(app.getSlowQueryThresholdMs())
                .active(app.isActive())
                .createdAt(app.getCreatedAt())
                .build();
    }
}
