package com.queryanalyzer.sample.repository;

import com.queryanalyzer.sample.domain.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // Used in a loop -> triggers N+1
    List<Order> findByCustomerId(Long customerId);

    // No index -> triggers MISSING_INDEX
    List<Order> findByStatus(String status);

    // Compound, no index -> triggers MISSING_INDEX
    List<Order> findByCustomerIdAndStatus(Long customerId, String status);
}
