package com.queryanalyzer.backend.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class N1PatternDTO {
    private String sqlHash;
    private String pattern;
    private String tableName;
    private long occurrences;
}
