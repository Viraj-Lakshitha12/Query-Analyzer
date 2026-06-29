package com.queryanalyzer.sample.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Order Entity.
 * NOTE: Missing index on status is intentional. This is a demo app
 * designed to generate bad queries (sequential scans) for QueryAnalyzer evaluation.
 */
@Entity
@Table(name = "orders")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    // Simple string to keep demo queries readable without extra joins
    private String productName;

    private Double amount;

    // e.g. PENDING, COMPLETED, CANCELLED. Deliberately no index.
    private String status;

    private LocalDateTime createdAt;
}
