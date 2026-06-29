package com.queryanalyzer.sample.domain;

import jakarta.persistence.*;
import lombok.*;

/**
 * Product Entity.
 * NOTE: Missing indexes on category and brand are intentional. This is a demo app
 * designed to generate bad queries (sequential scans) for QueryAnalyzer evaluation.
 */
@Entity
@Table(name = "products")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    // Deliberately no index
    private String category;

    private Double price;

    private Integer stockQuantity;

    // Deliberately no index
    private String brand;
}
