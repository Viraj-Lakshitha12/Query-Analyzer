package com.queryanalyzer.backend.service;

import com.queryanalyzer.backend.domain.QueryIssue;
import com.queryanalyzer.backend.domain.QueryLog;
import com.queryanalyzer.backend.repository.QueryIssueRepository;
import com.queryanalyzer.backend.util.QueryNormalizer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class N1DetectionService {

    private static final int    THRESHOLD_COUNT  = 10;
    private static final long   WINDOW_MS        = 500L;

    private final StringRedisTemplate redis;
    private final QueryIssueRepository issueRepository;
    private final QueryNormalizer normalizer;

    /**
     * Called for EVERY incoming QueryLog (fast + slow).
     * Uses atomic Redis INCR to count how many times the same
     * SQL pattern was executed within the last 500ms for this app.
     * Only applies to SELECT statements - N+1 is a read pattern, not a write pattern.
     */
    public void check(QueryLog queryLog) {
        // N+1 is specifically about repeated SELECT queries in a loop.
        // INSERT/UPDATE/DELETE should never trigger N+1 detection.
        if (!"SELECT".equals(queryLog.getQueryType())) {
            return;
        }

        String normalized = normalizer.normalize(queryLog.getSqlText());
        String sqlHash    = DigestUtils.md5Hex(normalized);

        String redisKey   = "n1:" + queryLog.getApp().getId() + ":" + sqlHash;

        Long count = redis.opsForValue().increment(redisKey);
        if (count == null) return;

        // Start the window TTL on the very first hit
        if (count == 1) {
            redis.expire(redisKey, WINDOW_MS, TimeUnit.MILLISECONDS);
        }

        // Flag N+1 exactly at the threshold (not every hit after — avoid duplicate issues)
        if (count == THRESHOLD_COUNT) {
            flagN1Issue(queryLog, normalized, count);

            // Update QueryLog status to N1 if not already SLOW
            if ("FAST".equals(queryLog.getStatus())) {
                queryLog.setStatus("N1");
                // Caller is responsible for saving queryLog after this method returns
            }
        }
    }

    private void flagN1Issue(QueryLog queryLog, String pattern, long count) {
        // Guard: don't create duplicate N+1 issues for the same log
        boolean alreadyFlagged = issueRepository
            .existsByQueryLogAndIssueType(queryLog, "N_PLUS_ONE");
        if (alreadyFlagged) return;

        String suggestion = String.format(
            "N+1 Query detected: the pattern [%s] was executed %d times within " +
            "500ms. Consider using a JPQL FETCH JOIN, @EntityGraph, or " +
            "@BatchSize annotation to fetch related collections in a single query.",
            truncate(pattern, 120), count
        );

        issueRepository.save(QueryIssue.builder()
            .queryLog(queryLog)
            .issueType("N_PLUS_ONE")
            .severity("CRITICAL")
            .ruleSuggestion(suggestion)
            .resolved(false)
            .createdAt(Instant.now())
            .build());

        log.info("N+1 detected: appId={} pattern={}",
            queryLog.getApp().getId(), truncate(pattern, 60));
    }

    private String truncate(String s, int max) {
        return s.length() > max ? s.substring(0, max) + "..." : s;
    }
}
