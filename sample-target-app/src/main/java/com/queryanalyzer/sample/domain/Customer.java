package com.queryanalyzer.sample.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Customer Entity.
 * NOTE: Missing indexes on email and city are intentional. This is a demo app
 * designed to generate bad queries (sequential scans) for QueryAnalyzer evaluation.
 */
@Entity
@Table(name = "customers")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    // Deliberately no unique constraint or index
    private String email;

    // Deliberately no index
    private String city;

    private String phone;

    private LocalDateTime createdAt;
}
