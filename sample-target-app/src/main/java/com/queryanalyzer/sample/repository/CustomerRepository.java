package com.queryanalyzer.sample.repository;

import com.queryanalyzer.sample.domain.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    // No index on email -> triggers MISSING_INDEX
    // Using Containing for partial match (LIKE '%term%') which is slower than exact match
    List<Customer> findByEmailContaining(String email);

    // No index on city -> triggers MISSING_INDEX and feeds N+1 demo
    List<Customer> findByCity(String city);
}
