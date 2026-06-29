package com.queryanalyzer.sample.repository;

import com.queryanalyzer.sample.domain.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // No index -> triggers MISSING_INDEX / full scan
    List<Product> findByCategory(String category);

    // No index -> triggers MISSING_INDEX
    List<Product> findByBrand(String brand);

    // Full scan on a range condition
    List<Product> findByPriceGreaterThan(Double price);
}
