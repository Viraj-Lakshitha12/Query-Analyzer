package com.queryanalyzer.backend.security;

import com.queryanalyzer.backend.domain.App;
import com.queryanalyzer.backend.repository.AppRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class SdkKeyAuthFilter extends OncePerRequestFilter {

    private final AppRepository appRepository;
    private final StringRedisTemplate redisTemplate;

    /**
     * ONLY run this filter for /api/v1/ingest/** requests.
     * For everything else (auth, dashboard, swagger, etc.) skip entirely.
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/v1/ingest");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 1. Extract header
        String sdkKey = request.getHeader("X-SDK-Key");

        if (sdkKey == null || sdkKey.isBlank()) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Missing X-SDK-Key");
            return;
        }

        // 2. Redis cache-aside lookup
        String redisKey = "sdk:" + sdkKey;
        String cachedAppId = null;

        try {
            cachedAppId = redisTemplate.opsForValue().get(redisKey);
        } catch (Exception e) {
            log.warn("Redis unavailable for SDK key cache, falling back to DB: {}", e.getMessage());
        }

        // 3. Cache HIT — use cachedAppId directly
        if (cachedAppId != null) {
            setAuthentication(cachedAppId);
            filterChain.doFilter(request, response);
            return;
        }

        // 4. Cache MISS — query DB
        Optional<App> optionalApp = appRepository.findBySdkKey(sdkKey);

        if (optionalApp.isEmpty()) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid SDK key");
            return;
        }

        App app = optionalApp.get();

        if (!app.isActive()) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "App is inactive");
            return;
        }

        // 5. Cache for 5 minutes
        try {
            redisTemplate.opsForValue().set(redisKey, app.getId().toString(), 5, TimeUnit.MINUTES);
        } catch (Exception e) {
            log.warn("Failed to cache SDK key in Redis: {}", e.getMessage());
        }

        // 6. Set authentication
        setAuthentication(app.getId().toString());
        filterChain.doFilter(request, response);
    }

    private void setAuthentication(String appId) {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(appId, null, List.of());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }
}
