package com.queryanalyzer.backend;

import com.queryanalyzer.backend.domain.App;
import com.queryanalyzer.backend.domain.User;
import com.queryanalyzer.backend.dto.QueryEventRequest;
import com.queryanalyzer.backend.repository.AppRepository;
import com.queryanalyzer.backend.repository.ExecutionPlanRepository;
import com.queryanalyzer.backend.repository.QueryIssueRepository;
import com.queryanalyzer.backend.repository.QueryLogRepository;
import com.queryanalyzer.backend.repository.UserRepository;
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
    private QueryLogRepository queryLogRepository;

    @Autowired
    private QueryIssueRepository queryIssueRepository;
    
    @Autowired
    private ExecutionPlanRepository executionPlanRepository;

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
        // Cascades to apps, query_logs, execution_plans, and query_issues
        if (testUser != null) {
            userRepository.delete(testUser);
        }
    }

    private void sendEvent(String sql, long durationMs) {
        QueryEventRequest event = new QueryEventRequest();
        event.setSqlText(sql);
        event.setDurationMs(durationMs);
        event.setCapturedAt(Instant.now());
        event.setCallerClass("com.example.TestService");
        event.setCallerMethod("testMethod");

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-SDK-Key", testSdkKey);
        HttpEntity<QueryEventRequest> request = new HttpEntity<>(event, headers);

        ResponseEntity<Void> res = restTemplate.exchange("/api/v1/ingest/query", HttpMethod.POST, request, Void.class);
        assertEquals(202, res.getStatusCode().value(), "Ingest should return HTTP 202 ACCEPTED");
    }

    @Test
    void testSlowQueryDetection() throws InterruptedException {
        sendEvent("SELECT * FROM users WHERE full_name = 'test'", 850);
        
        Thread.sleep(2000); // Wait for async processing

        long logCount = queryLogRepository.findAll().stream().filter(l -> l.getApp().getId().equals(testApp.getId())).count();
        assertEquals(1, logCount, "Should have 1 query log for test app");
        
        String status = queryLogRepository.findAll().stream()
                .filter(l -> l.getApp().getId().equals(testApp.getId()))
                .findFirst().get().getStatus();
        assertEquals("SLOW", status, "Status should be SLOW");
        
        UUID logId = queryLogRepository.findAll().stream()
                .filter(l -> l.getApp().getId().equals(testApp.getId()))
                .findFirst().get().getId();
                
        long planCount = executionPlanRepository.findAll().stream()
                .filter(p -> p.getQueryLog().getId().equals(logId))
                .count();
        assertEquals(1, planCount, "Should have 1 execution plan for the slow query");
    }

    @Test
    void testN1PatternDetection() throws InterruptedException {
        String sql = "SELECT * FROM apps WHERE environment = ?";
        for (int i = 0; i < 11; i++) {
            sendEvent(sql, 15);
        }
        
        Thread.sleep(2000); // Wait for async processing

        long n1Count = queryIssueRepository.findAll().stream()
                .filter(issue -> issue.getQueryLog().getApp().getId().equals(testApp.getId()))
                .filter(issue -> "N_PLUS_ONE".equals(issue.getIssueType()))
                .count();
        assertEquals(1, n1Count, "Should have exactly 1 N+1 issue for test app");
    }

    @Test
    void testFastQueryNotFlagged() throws InterruptedException {
        sendEvent("SELECT * FROM users WHERE id = '00000000-0000-0000-0000-000000000000'", 5);
        
        Thread.sleep(1000); // Wait for async processing

        long logCount = queryLogRepository.findAll().stream().filter(l -> l.getApp().getId().equals(testApp.getId())).count();
        assertEquals(1, logCount, "Should have 1 query log for test app");
        
        String status = queryLogRepository.findAll().stream()
                .filter(l -> l.getApp().getId().equals(testApp.getId()))
                .findFirst().get().getStatus();
        assertEquals("FAST", status, "Status should be FAST");
        
        long issueCount = queryIssueRepository.findAll().stream()
                .filter(issue -> issue.getQueryLog().getApp().getId().equals(testApp.getId()))
                .count();
        assertEquals(0, issueCount, "Should have NO query issues for test app");
    }

    @Test
    void testOverallAccuracy() throws InterruptedException {
        // Plant 10 slow queries
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
        
        Thread.sleep(5000); // Wait for async processing

        long detectedIssues = queryIssueRepository.findAll().stream()
                .filter(issue -> issue.getQueryLog().getApp().getId().equals(testApp.getId()))
                .count();
        
        double accuracy = (detectedIssues / 20.0) * 100.0;
        
        System.out.println("=================================================");
        System.out.println("Detection accuracy: " + detectedIssues + "/20 = " + accuracy + "%");
        System.out.println("=================================================");
        
        assertTrue(accuracy >= 80.0, "Accuracy should be at least 80%");
    }
}
