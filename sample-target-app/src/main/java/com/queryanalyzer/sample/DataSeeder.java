package com.queryanalyzer.sample;

import com.queryanalyzer.sample.domain.*;
import com.queryanalyzer.sample.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    @Override
    public void run(String... args) throws Exception {
        if (customerRepository.count() > 0) {
            log.info("Database already seeded. Skipping...");
            return;
        }

        log.info("Starting data seed...");
        Random random = new Random(42);

        // 1. Seed Customers
        String[] cities = {"Colombo", "Negombo", "Kandy", "Galle", "Jaffna"};
        List<Customer> customers = new ArrayList<>();
        for (int i = 1; i <= 100; i++) {
            customers.add(Customer.builder()
                    .name("Customer " + i)
                    .email("customer" + i + "@example.com")
                    .city(cities[random.nextInt(cities.length)])
                    .phone("077" + (1000000 + random.nextInt(9000000)))
                    .createdAt(LocalDateTime.now().minusDays(random.nextInt(90)))
                    .build());
        }
        customerRepository.saveAll(customers);
        log.info("Seeded 100 customers");

        // 2. Seed Products
        String[] categories = {"Electronics", "Clothing", "Food", "Books", "Sports"};
        String[][] brands = {
                {"Samsung", "Sony", "LG", "Apple"},
                {"Nike", "Adidas", "Puma", "Levi's"},
                {"Nestle", "Kraft", "Heinz", "Kellogg's"},
                {"Penguin", "HarperCollins", "Macmillan", "Simon"},
                {"Wilson", "Spalding", "Yonex", "Babolat"}
        };
        int productCount = 500; // Original count
        List<Product> products = new ArrayList<>();
        for (int i = 1; i <= productCount; i++) {
            int catIdx = random.nextInt(categories.length);
            products.add(Product.builder()
                    .name("Product " + i)
                    .category(categories[catIdx])
                    .brand(brands[catIdx][random.nextInt(4)])
                    .price(10.0 + (random.nextDouble() * 990.0))
                    .stockQuantity(random.nextInt(500))
                    .build());
        }
        productRepository.saveAll(products);
        log.info("Seeded 500 products");

        // 3. Seed Orders & OrderItems
        String[] statuses = {"PENDING", "COMPLETED", "CANCELLED"};
        List<Order> orders = new ArrayList<>();
        List<OrderItem> orderItems = new ArrayList<>();

        // Need to refetch or use IDs to avoid detached entity issues, but saveAll returns attached.
        // For simplicity we just use the lists since they have IDs after saveAll.
        
        for (int i = 1; i <= 1000; i++) {
            Customer c = customers.get(random.nextInt(customers.size()));
            Product p = products.get(random.nextInt(products.size()));
            
            Order order = Order.builder()
                    .customer(c)
                    .productName(p.getName())
                    .amount(p.getPrice() * (1 + random.nextInt(3)))
                    .status(statuses[random.nextInt(statuses.length)])
                    .createdAt(LocalDateTime.now().minusDays(random.nextInt(90)))
                    .build();
            orders.add(order);
        }
        orders = orderRepository.saveAll(orders);
        log.info("Seeded 1,000 orders");

        for (Order order : orders) {
            int numItems = 2 + random.nextInt(3); // 2 to 4 items per order
            for (int j = 0; j < numItems; j++) {
                Product p = products.get(random.nextInt(products.size()));
                int qty = 1 + random.nextInt(5);
                orderItems.add(OrderItem.builder()
                        .order(order)
                        .productName(p.getName())
                        .quantity(qty)
                        .unitPrice(p.getPrice())
                        .build());
            }
            if (orderItems.size() > 5000) {
                orderItemRepository.saveAll(orderItems);
                orderItems.clear();
            }
        }
        if (!orderItems.isEmpty()) {
            orderItemRepository.saveAll(orderItems);
        }
        log.info("Seeded ~2,500 order items");

        log.info("Data seeding complete!");
    }
}
