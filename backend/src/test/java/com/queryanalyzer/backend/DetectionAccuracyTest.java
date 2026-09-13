package com.queryanalyzer.backend;

import com.queryanalyzer.backend.domain.App;
import com.queryanalyzer.backend.domain.User;
import com.queryanalyzer.backend.dto.QueryEventRequest;
import com.queryanalyzer.backend.repository.AppRepository;
import com.queryanalyzer.backend.repository.UserRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.support.TransactionTemplate;
import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class DetectionAccuracyTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private AppRepository appRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private TransactionTemplate transactionTemplate;

    private String testSdkKey;
    private App testApp;
    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .email("test_dissertation_" + UUID.randomUUID() + "@example.com")
                .fullName("Test User")
                .passwordHash("hash")
                .role("USER")
                .build();
        testUser = userRepository.save(testUser);

        testSdkKey = UUID.randomUUID().toString();
        testApp = App.builder()
                .owner(testUser)
                .name("Dissertation Test App")
                .environment("DEV")
                .active(true)
                .sdkKey(testSdkKey)
                .slowQueryThresholdMs(200)
                .build();
        testApp = appRepository.save(testApp);
    }

    @AfterEach
    void tearDown() {
        if (testUser != null) {
            transactionTemplate.executeWithoutResult(status -> {
                userRepository.deleteById(testUser.getId());
            });
        }
    }

    // ── Native SQL query helpers (no lazy-loading issues) ──────────

    private long countLogsByAppAndStatus(UUID appId, String status) {
        return transactionTemplate.execute(tx -> {
            if (status == null) {
                return ((Number) entityManager
                        .createNativeQuery("SELECT COUNT(*) FROM query_logs WHERE app_id = :appId")
                        .setParameter("appId", appId)
                        .getSingleResult()).longValue();
            }
            return ((Number) entityManager
                    .createNativeQuery("SELECT COUNT(*) FROM query_logs WHERE app_id = :appId AND status = :status")
                    .setParameter("appId", appId)
                    .setParameter("status", status)
                    .getSingleResult()).longValue();
        });
    }

    private long countPlansByApp(UUID appId) {
        return transactionTemplate.execute(tx -> ((Number) entityManager
                .createNativeQuery(
                        "SELECT COUNT(*) FROM execution_plans ep " +
                                "JOIN query_logs ql ON ep.query_log_id = ql.id " +
                                "WHERE ql.app_id = :appId")
                .setParameter("appId", appId)
                .getSingleResult()).longValue());
    }

    private long countIssuesByAppAndType(UUID appId, String issueType) {
        return transactionTemplate.execute(tx -> {
            if (issueType == null) {
                return ((Number) entityManager
                        .createNativeQuery(
                                "SELECT COUNT(*) FROM query_issues qi " +
                                        "JOIN query_logs ql ON qi.query_log_id = ql.id " +
                                        "WHERE ql.app_id = :appId")
                        .setParameter("appId", appId)
                        .getSingleResult()).longValue();
            }
            return ((Number) entityManager
                    .createNativeQuery(
                            "SELECT COUNT(*) FROM query_issues qi " +
                                    "JOIN query_logs ql ON qi.query_log_id = ql.id " +
                                    "WHERE ql.app_id = :appId AND qi.issue_type = :issueType")
                    .setParameter("appId", appId)
                    .setParameter("issueType", issueType)
                    .getSingleResult()).longValue();
        });
    }

    // ── HTTP helper ───────────────────────────────────────────────

    private void sendEvent(String sql, long durationMs) throws InterruptedException {
        QueryEventRequest event = new QueryEventRequest();
        event.setSqlText(sql);
        event.setDurationMs(durationMs);
        event.setCapturedAt(Instant.now());
        event.setCallerClass("com.example.TestService");
        event.setCallerMethod("testMethod");

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-SDK-Key", testSdkKey);
        HttpEntity<QueryEventRequest> request = new HttpEntity<>(event, headers);

        // Throttle to avoid hitting the 100 req/min rate limiter
        Thread.sleep(80);

        ResponseEntity<Void> res = restTemplate.exchange(
                "/api/v1/ingest/query", HttpMethod.POST, request, Void.class);
        assertEquals(202, res.getStatusCode().value(),
                "Ingest should return HTTP 202 ACCEPTED");
    }

    // ── Test methods ──────────────────────────────────────────────

    @Test
    void testSlowQueryDetection() throws InterruptedException {
        sendEvent("SELECT * FROM users WHERE full_name = 'test'", 850);

        Thread.sleep(3000); // Wait for async processing

        long logCount = countLogsByAppAndStatus(testApp.getId(), null);
        assertEquals(1, logCount, "Should have 1 query log for test app");

        long slowCount = countLogsByAppAndStatus(testApp.getId(), "SLOW");
        assertEquals(1, slowCount, "Status should be SLOW");

        long planCount = countPlansByApp(testApp.getId());
        assertEquals(1, planCount, "Should have 1 execution plan for the slow query");
    }

    @Test
    void testN1PatternDetection() throws InterruptedException {
        String sql = "SELECT * FROM apps WHERE environment = ?";
        for (int i = 0; i < 11; i++) {
            sendEvent(sql, 15);
        }

        Thread.sleep(3000); // Wait for async processing

        long n1Count = countIssuesByAppAndType(testApp.getId(), "N_PLUS_ONE");
        assertEquals(1, n1Count, "Should have exactly 1 N+1 issue for test app");
    }

    @Test
    void testFastQueryNotFlagged() throws InterruptedException {
        sendEvent("SELECT * FROM users WHERE id = '00000000-0000-0000-0000-000000000000'", 5);

        Thread.sleep(2000); // Wait for async processing

        long logCount = countLogsByAppAndStatus(testApp.getId(), null);
        assertEquals(1, logCount, "Should have 1 query log for test app");

        long fastCount = countLogsByAppAndStatus(testApp.getId(), "FAST");
        assertEquals(1, fastCount, "Status should be FAST");

        long issueCount = countIssuesByAppAndType(testApp.getId(), null);
        assertEquals(0, issueCount, "Should have NO query issues for test app");
    }

    @Test
    void testOverallAccuracy() throws InterruptedException {
        // Plant 10 slow queries (durationMs > 200ms threshold)
        for (int i = 0; i < 10; i++) {
            sendEvent("SELECT * FROM users WHERE full_name = 'slow_" + i + "'", 250);
        }

        // Plant 10 N+1 patterns (each pattern needs 11 calls)
        for (int p = 0; p < 10; p++) {
            String sql = "SELECT * FROM apps WHERE environment = 'pattern_" + p + "'";
            for (int i = 0; i < 11; i++) {
                sendEvent(sql, 10);
            }
        }

        Thread.sleep(10000); // Wait for all async processing to complete

        long detectedIssues = countIssuesByAppAndType(testApp.getId(), null);

        double accuracy = (detectedIssues / 20.0) * 100.0;

        System.out.println("=================================================");
        System.out.println("DISSERTATION RESULT — Detection Accuracy Test");
        System.out.println("-------------------------------------------------");
        System.out.println("Planted issues:   20 (10 slow + 10 N+1 patterns)");
        System.out.println("Detected issues:  " + detectedIssues);
        System.out.println("Accuracy:         " + String.format("%.1f", accuracy) + "%");
        System.out.println("=================================================");

        assertTrue(accuracy >= 80.0, "Accuracy should be at least 80% but was " + accuracy + "%");
    }
}
