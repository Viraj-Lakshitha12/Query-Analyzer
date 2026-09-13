package com.queryanalyzer.sample.controller;

import com.queryanalyzer.sample.domain.Customer;
import com.queryanalyzer.sample.domain.Order;
import com.queryanalyzer.sample.domain.OrderItem;
import com.queryanalyzer.sample.domain.Product;
import com.queryanalyzer.sample.repository.CustomerRepository;
import com.queryanalyzer.sample.repository.OrderItemRepository;
import com.queryanalyzer.sample.repository.OrderRepository;
import com.queryanalyzer.sample.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Random;

import jakarta.persistence.EntityManager;

@RestController
@RequestMapping("/demo")
@RequiredArgsConstructor
public class DemoController {

    private final EntityManager em;

    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final Random random = new Random();

    // ── Missing Index Endpoints ───────────────────────────────────────────

    @GetMapping("/slow/customer-by-email")
    public Map<String, Object> customerByEmail(@RequestParam(defaultValue = "customer") String email) {
        // Using partial match (LIKE '%term%') which is slower than exact match
        // and cannot be helped by a normal index even if one existed
        List<Customer> list = customerRepository.findByEmailContaining(email);
        return Map.<String, Object>of("endpoint", "Customer by Email (Partial Match)", "results", list.size());
    }

    @GetMapping("/slow/guaranteed-slow")
    public Map<String, Object> guaranteedSlow() {
        // Execute a real SQL query that sleeps in the database for 300ms (0.3 seconds)
        // This ensures the QueryAnalyzer JDBC interceptor actually measures it as > 200ms
        em.createNativeQuery("SELECT pg_sleep(0.3)").getResultList();
        return Map.<String, Object>of("endpoint", "Guaranteed Slow Query (>200ms)", "status", "success");
    }

    @GetMapping("/slow/customer-by-city")
    public Map<String, Object> customerByCity(@RequestParam(defaultValue = "Colombo") String city) {
        List<Customer> list = customerRepository.findByCity(city);
        return Map.<String, Object>of("endpoint", "Customer by City", "results", list.size());
    }

    @GetMapping("/slow/products-by-category")
    public Map<String, Object> productsByCategory(@RequestParam(defaultValue = "Electronics") String category) {
        List<Product> list = productRepository.findByCategory(category);
        return Map.<String, Object>of("endpoint", "Products by Category", "results", list.size());
    }

    @GetMapping("/slow/products-by-brand")
    public Map<String, Object> productsByBrand(@RequestParam(defaultValue = "Samsung") String brand) {
        List<Product> list = productRepository.findByBrand(brand);
        return Map.<String, Object>of("endpoint", "Products by Brand", "results", list.size());
    }

    @GetMapping("/slow/products-above-price")
    public Map<String, Object> productsAbovePrice(@RequestParam(defaultValue = "500.0") Double price) {
        List<Product> list = productRepository.findByPriceGreaterThan(price);
        return Map.<String, Object>of("endpoint", "Products above Price", "results", list.size());
    }

    @GetMapping("/slow/orders-by-status")
    public Map<String, Object> ordersByStatus(@RequestParam(defaultValue = "PENDING") String status) {
        List<Order> list = orderRepository.findByStatus(status);
        return Map.<String, Object>of("endpoint", "Orders by Status", "results", list.size());
    }

    // ── N+1 Endpoints ─────────────────────────────────────────────────────

    @GetMapping("/slow/orders-by-city")
    public Map<String, Object> ordersByCityN1(@RequestParam(defaultValue = "Galle") String city) {
        int orderCount = 0;
        // Loop EXACTLY 15 times to guarantee the N+1 threshold (10 queries) is crossed
        for (int i = 1; i <= 15; i++) {
            List<Order> orders = orderRepository.findByCustomerId((long) i);
            orderCount += orders.size();
        }
        return Map.<String, Object>of("endpoint", "Orders by City (Guaranteed N+1)", "queries_executed", 15, "orders_found", orderCount);
    }

    @GetMapping("/slow/order-items-bulk")
    public Map<String, Object> orderItemsBulk(@RequestParam(defaultValue = "20") int limit) {
        List<Order> orders = orderRepository.findAll(PageRequest.of(0, limit)).getContent();
        int itemsCount = 0;
        // Loop triggers N+1 query pattern on order_items table
        for (Order o : orders) {
            List<OrderItem> items = orderItemRepository.findByOrderId(o.getId());
            itemsCount += items.size();
        }
        return Map.<String, Object>of("endpoint", "Order Items Bulk (N+1)", "orders_scanned", orders.size(), "items_found", itemsCount);
    }

    // ── Control Endpoints (Fast) ──────────────────────────────────────────

    @GetMapping("/fast/customer-by-id")
    public Map<String, Object> customerById(@RequestParam(defaultValue = "1") Long id) {
        return customerRepository.findById(id)
                .map(c -> Map.<String, Object>of("endpoint", "Customer by ID (Fast)", "found", true))
                .orElse(Map.<String, Object>of("endpoint", "Customer by ID (Fast)", "found", false));
    }

    @GetMapping("/fast/order-by-id")
    public Map<String, Object> orderById(@RequestParam(defaultValue = "1") Long id) {
        return orderRepository.findById(id)
                .map(o -> Map.<String, Object>of("endpoint", "Order by ID (Fast)", "found", true))
                .orElse(Map.<String, Object>of("endpoint", "Order by ID (Fast)", "found", false));
    }

    // ── Load Test Endpoints ───────────────────────────────────────────────

    @PostMapping("/load-test")
    public Map<String, Object> loadTest(@RequestParam(defaultValue = "50") int iterations) {
        for (int i = 0; i < iterations; i++) {
            callRandomSlowEndpoint();
        }
        return Map.<String, Object>of("endpoint", "Load Test", "iterations", iterations, "status", "complete");
    }

    @PostMapping("/load-test/mixed")
    public Map<String, Object> loadTestMixed(@RequestParam(defaultValue = "100") int iterations) {
        int fastCount = 0;
        int slowCount = 0;
        for (int i = 0; i < iterations; i++) {
            if (random.nextInt(100) < 70) {
                // 70% fast
                customerById((long) (1 + random.nextInt(1000)));
                fastCount++;
            } else {
                // 30% slow
                callRandomSlowEndpoint();
                slowCount++;
            }
        }
        return Map.<String, Object>of("endpoint", "Mixed Load Test", "fast_calls", fastCount, "slow_calls", slowCount);
    }

    private void callRandomSlowEndpoint() {
        int choice = random.nextInt(8);
        switch (choice) {
            case 0 -> customerByEmail("customer"); // Partial match will scan many rows
            case 1 -> customerByCity("Colombo");
            case 2 -> productsByCategory("Clothing");
            case 3 -> productsByBrand("Nike");
            case 4 -> productsAbovePrice(100.0);
            case 5 -> ordersByStatus("COMPLETED");
            case 6 -> ordersByCityN1("Kandy");
            case 7 -> orderItemsBulk(10);
        }
    }
}
