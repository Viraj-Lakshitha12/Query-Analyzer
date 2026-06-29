package com.queryanalyzer.backend.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "query_logs")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class QueryLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "app_id", nullable = false)
    private App app;

    @Column(name = "sql_text", columnDefinition = "TEXT", nullable = false)
    private String sqlText;

    @Column(name = "sql_hash", nullable = false)
    private String sqlHash;

    @Column(name = "duration_ms", nullable = false)
    private int durationMs;

    @Column(name = "query_type")
    private String queryType;

    @Column(name = "table_name")
    private String tableName;

    @Builder.Default
    @Column(nullable = false)
    private String status = "FAST";

    @Column(name = "captured_at")
    private Instant capturedAt;

    @Column(name = "caller_class")
    private String callerClass;

    @Column(name = "caller_method")
    private String callerMethod;
}
