package com.queryanalyzer.backend.config;


import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bucket4j;
import io.github.bucket4j.Refill;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(RateLimitingInterceptor.class);
    private static final String SDK_HEADER = "X-SDK-Key";
    private static final int RATE_LIMIT = 100;
    private static final Duration REFILL_INTERVAL = Duration.ofMinutes(1);

    private final Map<String, Bucket> bucketCache = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request,
                             @NonNull HttpServletResponse response,
                             @NonNull Object handler) throws IOException {
        String sdkKey = request.getHeader(SDK_HEADER);
        if (sdkKey == null || sdkKey.isBlank()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"status\":400,\"message\":\"Missing X-SDK-Key header\"}");
            return false;
        }

        Bucket bucket = bucketCache.computeIfAbsent(sdkKey, this::newBucket);
        if (!bucket.tryConsume(1)) {
            log.warn("Rate limit exceeded for SDK key {}", sdkKey);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"status\":429,\"message\":\"Too many requests. Try again later.\"}");
            return false;
        }

        return true;
    }

    private Bucket newBucket(String unusedKey) {
        return Bucket4j.builder()
                .addLimit(Bandwidth.classic(RATE_LIMIT, Refill.intervally(RATE_LIMIT, REFILL_INTERVAL)))
                .build();
    }
}
