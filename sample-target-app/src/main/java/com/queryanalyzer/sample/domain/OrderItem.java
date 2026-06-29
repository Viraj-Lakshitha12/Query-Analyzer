package com.queryanalyzer.sample.domain;

import jakarta.persistence.*;
import lombok.*;

/**
 * OrderItem Entity.
 * NOTE: Used to trigger N+1 query patterns distinct from the Customer/Order relationship.
 */
@Entity
@Table(name = "order_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    private String productName;

    private Integer quantity;

    private Double unitPrice;
}
