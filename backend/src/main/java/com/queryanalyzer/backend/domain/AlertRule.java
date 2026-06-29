package com.queryanalyzer.backend.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "alert_rules")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class AlertRule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "app_id", nullable = false)
    private App app;

    @Column(nullable = false)
    private String metric;

    @Column(name = "threshold_value", nullable = false)
    private int thresholdValue;

    @Column(nullable = false)
    private String channel;

    @Column(name = "webhook_url")
    private String webhookUrl;

    @Column(name = "email_address")
    private String emailAddress;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "last_triggered")
    private Instant lastTriggered;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
