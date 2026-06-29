package com.queryanalyzer.backend.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AnalyticsDTO {
    private Summary summary;
    private List<DailyStatDTO> dailyStats;
    private List<QueryLogDTO> topSlowQueries;

    @Data
    @Builder
    public static class Summary {
        private long totalQueries;
        private long slowQueries;
        private long n1Detections;
        private double avgDurationMs;
        private double p95DurationMs;
    }
}
