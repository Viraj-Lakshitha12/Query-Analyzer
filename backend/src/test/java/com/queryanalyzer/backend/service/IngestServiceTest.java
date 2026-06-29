package com.queryanalyzer.backend.service;

import com.queryanalyzer.backend.domain.App;
import com.queryanalyzer.backend.domain.QueryLog;
import com.queryanalyzer.backend.dto.QueryEventRequest;
import com.queryanalyzer.backend.repository.AppRepository;
import com.queryanalyzer.backend.repository.QueryLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IngestServiceTest {

    @Mock
    private AppRepository appRepository;

    @Mock
    private QueryLogRepository queryLogRepository;

    @Mock
    private AnalysisCoordinator analysisCoordinator;

    @InjectMocks
    private IngestService ingestService;

    private App testApp;

    @BeforeEach
    void setUp() {
        testApp = App.builder()
                .id(UUID.randomUUID())
                .name("Test App")
                .slowQueryThresholdMs(200)
                .build();
    }

    @Test
    void testProcessBatch_FiltersStaleAOPPlaceholder() {
        // Arrange
        when(appRepository.findById(testApp.getId())).thenReturn(Optional.of(testApp));

        QueryEventRequest staleEvent = new QueryEventRequest();
        staleEvent.setSqlText("sql unavailable in pure spring aop without datasource-proxy");
        staleEvent.setDurationMs(100);

        // Act
        ingestService.processBatchAsync(testApp.getId(), List.of(staleEvent));

        // Assert
        verify(queryLogRepository, never()).save(any(QueryLog.class));
        verify(analysisCoordinator, never()).analyze(any());
    }

    @Test
    void testProcessBatch_FiltersNullSql() {
        // Arrange
        when(appRepository.findById(testApp.getId())).thenReturn(Optional.of(testApp));

        QueryEventRequest nullSqlEvent = new QueryEventRequest();
        nullSqlEvent.setSqlText(null);
        nullSqlEvent.setDurationMs(100);

        // Act
        ingestService.processBatchAsync(testApp.getId(), List.of(nullSqlEvent));

        // Assert
        verify(queryLogRepository, never()).save(any(QueryLog.class));
        verify(analysisCoordinator, never()).analyze(any());
    }

    @Test
    void testProcessBatch_ValidQueryGetsSavedAndAnalyzed() {
        // Arrange
        when(appRepository.findById(testApp.getId())).thenReturn(Optional.of(testApp));
        
        QueryLog mockSaved = QueryLog.builder().id(UUID.randomUUID()).build();
        when(queryLogRepository.save(any(QueryLog.class))).thenReturn(mockSaved);

        QueryEventRequest validEvent = new QueryEventRequest();
        validEvent.setSqlText("SELECT * FROM users WHERE id = 1");
        validEvent.setDurationMs(300);

        // Act
        ingestService.processBatchAsync(testApp.getId(), List.of(validEvent));

        // Assert
        verify(queryLogRepository, times(1)).save(any(QueryLog.class));
        verify(analysisCoordinator, times(1)).analyze(mockSaved);
    }
}
