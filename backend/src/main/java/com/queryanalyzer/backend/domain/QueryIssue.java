package com.queryanalyzer.backend.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "query_issues")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class QueryIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "query_log_id", nullable = false)
    private QueryLog queryLog;

    @Column(name = "issue_type", nullable = false)
    private String issueType;

    @Column(nullable = false)
    private String severity;

    @Column(name = "rule_suggestion", columnDefinition = "TEXT")
    private String ruleSuggestion;

    @Column(name = "ai_suggestion", columnDefinition = "TEXT")
    private String aiSuggestion;

    @Builder.Default
    @Column(name = "ai_enhanced")
    private boolean aiEnhanced = false;

    @Builder.Default
    @Column(nullable = false)
    private boolean resolved = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
