package com.queryanalyzer.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DailyStatDTO {
    private String date;
    private long total;
    private long slow;
    private double avgMs;
}
