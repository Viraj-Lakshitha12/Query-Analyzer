package com.queryanalyzer.sample.repository;

import com.queryanalyzer.sample.domain.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    // Used in a loop -> triggers a second, distinct N+1
    List<OrderItem> findByOrderId(Long orderId);
}
