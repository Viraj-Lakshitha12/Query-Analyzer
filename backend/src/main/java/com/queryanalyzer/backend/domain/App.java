package com.queryanalyzer.backend.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "apps")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class App {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false)
    private String name;

    @Column(name = "sdk_key", nullable = false, unique = true)
    private String sdkKey;

    @Builder.Default
    @Column(nullable = false)
    private String environment = "DEV";

    @Builder.Default
    @Column(name = "slow_query_threshold_ms", nullable = false)
    private int slowQueryThresholdMs = 200;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
