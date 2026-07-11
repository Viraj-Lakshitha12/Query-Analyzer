package com.queryanalyzer.backend.service;

import com.queryanalyzer.backend.domain.App;
import com.queryanalyzer.backend.domain.QueryLog;
import com.queryanalyzer.backend.repository.AppRepository;
import com.queryanalyzer.backend.repository.QueryIssueRepository;
import com.queryanalyzer.backend.repository.QueryLogRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import java.time.Instant;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
class N1DetectionIntegrationTest {

    @Autowired
    private N1DetectionService n1DetectionService;

    @Autowired
    private AppRepository appRepository;
    
    @Autowired
    private QueryLogRepository queryLogRepository;

    @Autowired
    private QueryIssueRepository issueRepository;

    @Autowired
    private StringRedisTemplate redisTemplate;

    private App testApp;

    @BeforeEach
    void setUp() {
        redisTemplate.getConnectionFactory().getConnection().serverCommands().flushDb();
        issueRepository.deleteAll();
        queryLogRepository.deleteAll();
        appRepository.deleteAll();

        testApp = App.builder()
                .name("Test App")
                .environment("DEV")
                .active(true)
                .sdkKey(UUID.randomUUID().toString())
                .build();
        testApp = appRepository.save(testApp);
    }

    @AfterEach
    void tearDown() {
        redisTemplate.getConnectionFactory().getConnection().serverCommands().flushDb();
    }

    @Test
    void testN1Detection_FlagsIssue_When10QueriesWithin500ms() {
        String sql = "SELECT * FROM orders WHERE user_id = " + UUID.randomUUID();

        // Send 10 queries rapidly
        for (int i = 0; i < 10; i++) {
            QueryLog log = QueryLog.builder()
                    .app(testApp)
                    .queryType("SELECT")
                    .sqlText(sql)
                    .status("FAST")
                    .durationMs(5)
                    .capturedAt(Instant.now())
                    .build();
            log = queryLogRepository.save(log);
            
            n1DetectionService.check(log);
            queryLogRepository.save(log); // Save status change if any
        }

        // Verify issue was created
        long issueCount = issueRepository.count();
        assertEquals(1, issueCount, "Exactly 1 N+1 issue should be created");
        
        var issues = issueRepository.findAll();
        assertEquals("N_PLUS_ONE", issues.get(0).getIssueType());
        assertEquals("CRITICAL", issues.get(0).getSeverity());
    }

    @Test
    void testN1Detection_NoFalsePositive_WhenQueriesSpacedOut() throws InterruptedException {
        String sql = "SELECT * FROM products WHERE category_id = " + UUID.randomUUID();

        // Send 9 queries rapidly
        for (int i = 0; i < 9; i++) {
            QueryLog log = QueryLog.builder()
                    .app(testApp)
                    .queryType("SELECT")
                    .sqlText(sql)
                    .status("FAST")
                    .durationMs(5)
                    .capturedAt(Instant.now())
                    .build();
            log = queryLogRepository.save(log);
            n1DetectionService.check(log);
        }

        // Wait for Redis TTL to expire (500ms + buffer)
        Thread.sleep(600);

        // Send 5 more queries (starts a new window)
        for (int i = 0; i < 5; i++) {
            QueryLog log = QueryLog.builder()
                    .app(testApp)
                    .queryType("SELECT")
                    .sqlText(sql)
                    .status("FAST")
                    .durationMs(5)
                    .capturedAt(Instant.now())
                    .build();
            log = queryLogRepository.save(log);
            n1DetectionService.check(log);
        }

        // Verify no issue created because no single 500ms window had 10 queries
        long issueCount = issueRepository.count();
        assertEquals(0, issueCount, "No N+1 issue should be created when queries span > 500ms window");
    }
}
