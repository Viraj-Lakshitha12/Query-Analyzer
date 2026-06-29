package com.queryanalyzer.backend.util;

import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * Strips literal values from SQL to produce a stable pattern string.
 * "SELECT * FROM orders WHERE id = 123" and
 * "SELECT * FROM orders WHERE id = 456" both normalize to
 * "select * from orders where id = ?"
 * making it possible to detect N+1 (same pattern, many executions).
 */
@Component
public class QueryNormalizer {

    private static final Pattern STRINGS  = Pattern.compile("'[^']*'");
    private static final Pattern NUMBERS  = Pattern.compile("\\b\\d+\\b");
    private static final Pattern IN_VALS  = Pattern.compile(
        "IN\\s*\\([^)]+\\)", Pattern.CASE_INSENSITIVE);
    private static final Pattern SPACES   = Pattern.compile("\\s+");

    public String normalize(String sql) {
        if (sql == null || sql.isBlank()) return "";
        String s = sql.trim().toLowerCase();
        s = STRINGS.matcher(s).replaceAll("?");
        s = NUMBERS.matcher(s).replaceAll("?");
        s = IN_VALS.matcher(s).replaceAll("IN (?)");
        return SPACES.matcher(s).replaceAll(" ").trim();
    }
}
