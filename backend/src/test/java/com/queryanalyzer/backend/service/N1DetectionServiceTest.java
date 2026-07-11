package com.queryanalyzer.backend.service;

import com.queryanalyzer.backend.domain.App;
import com.queryanalyzer.backend.domain.QueryIssue;
import com.queryanalyzer.backend.domain.QueryLog;
import com.queryanalyzer.backend.repository.QueryIssueRepository;
import com.queryanalyzer.backend.util.QueryNormalizer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class N1DetectionServiceTest {

    @Mock
    private StringRedisTemplate redis;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private QueryIssueRepository issueRepository;

    @Mock
    private QueryNormalizer normalizer;

    @InjectMocks
    private N1DetectionService n1DetectionService;

    private QueryLog testLog;
    private App testApp;

    @BeforeEach
    void setUp() {
        testApp = App.builder().id(UUID.randomUUID()).build();
        testLog = QueryLog.builder()
                .app(testApp)
                .sqlText("SELECT * FROM users WHERE id = 1")
                .status("FAST")
                .build();
    }

    @Test
    void testCheck_SetsTtlOnFirstHit() {
        // Arrange
        testLog.setQueryType("SELECT");
        when(normalizer.normalize(anyString())).thenReturn("SELECT * FROM users WHERE id = ?");
        when(redis.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment(anyString())).thenReturn(1L);

        // Act
        n1DetectionService.check(testLog);

        // Assert
        verify(redis, times(1)).expire(anyString(), eq(500L), eq(TimeUnit.MILLISECONDS));
        verify(issueRepository, never()).save(any(QueryIssue.class));
    }

    @Test
    void testCheck_FlagsN1IssueAtThreshold() {
        // Arrange
        testLog.setQueryType("SELECT");
        when(normalizer.normalize(anyString())).thenReturn("SELECT * FROM users WHERE id = ?");
        when(redis.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment(anyString())).thenReturn(10L); // THRESHOLD_COUNT

        when(issueRepository.existsByQueryLogAndIssueType(testLog, "N_PLUS_ONE")).thenReturn(false);

        // Act
        n1DetectionService.check(testLog);

        // Assert
        verify(redis, never()).expire(anyString(), anyLong(), any(TimeUnit.class));
        verify(issueRepository, times(1)).save(any(QueryIssue.class));
        assertEquals("N1", testLog.getStatus());
    }

    @Test
    void testCheck_DoesNotFlagN1IssueIfAlreadyExists() {
        // Arrange
        testLog.setQueryType("SELECT");
        when(normalizer.normalize(anyString())).thenReturn("SELECT * FROM users WHERE id = ?");
        when(redis.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment(anyString())).thenReturn(10L); // THRESHOLD_COUNT

        when(issueRepository.existsByQueryLogAndIssueType(testLog, "N_PLUS_ONE")).thenReturn(true);

        // Act
        n1DetectionService.check(testLog);

        // Assert
        verify(issueRepository, never()).save(any(QueryIssue.class));
    }

    @Test
    void testCheck_DoesNothingIfUnderThresholdAndNotFirst() {
        // Arrange
        testLog.setQueryType("SELECT");
        when(normalizer.normalize(anyString())).thenReturn("SELECT * FROM users WHERE id = ?");
        when(redis.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment(anyString())).thenReturn(5L);

        // Act
        n1DetectionService.check(testLog);

        // Assert
        verify(redis, never()).expire(anyString(), anyLong(), any(TimeUnit.class));
        verify(issueRepository, never()).save(any(QueryIssue.class));
        assertEquals("FAST", testLog.getStatus()); // remains FAST
    }
}
