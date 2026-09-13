# Sample Target App

Demo Spring Boot application with planted performance anti-patterns for testing Query Analyzer.

## Overview

This is a sample Spring Boot application designed to demonstrate Query Analyzer's capabilities. It includes intentional performance issues that trigger the detection system:
- Slow queries
- N+1 query patterns
- Missing indexes

## Tech Stack

- Java 17
- Spring Boot 3
- Spring Data JPA
- PostgreSQL
- Query Analyzer Agent (integrated)

## Prerequisites

- Query Analyzer backend running on port 8080
- PostgreSQL database
- Valid SDK key from Query Analyzer dashboard

## Configuration

Update `src/main/resources/application.yml` with your SDK key:

```yaml
queryanalyzer:
  enabled: true
  sdk-key: "ql_live_YOUR_GENERATED_SDK_KEY"
  server-url: http://localhost:8080
```

## Running the Sample App

```bash
./mvnw spring-boot:run
```

The app will start on port 8081.

## Demo Endpoints

### Slow Query Endpoints

- **GET /demo/slow/guaranteed-slow**
  - Executes a query with a 300ms database sleep
  - Triggers slow query detection (threshold: 200ms)

- **GET /demo/slow/order-items-bulk**
  - Simulates a bulk operation with slow queries
  - Multiple sequential queries with high duration

### N+1 Query Pattern Endpoints

- **GET /demo/slow/orders-by-city**
  - Executes 15 sequential queries to fetch orders by city
  - Classic N+1 pattern (1 query for orders + N queries for related data)
  - Triggers N+1 detection

### Load Testing Endpoints

- **POST /demo/load-test/mixed?iterations=50**
  - Sends a mix of fast and slow queries
  - Useful for testing detection accuracy under load

- **GET /demo/load-test/fast**
  - Executes fast queries only
  - Should not trigger any alerts

## Database Schema

The sample app uses a simple e-commerce schema:
- `customers` - Customer records
- `orders` - Order records linked to customers
- `order_items` - Order line items linked to orders
- `products` - Product catalog

## Expected Behavior

When you hit the demo endpoints:

1. **Slow queries** will appear in the Query Analyzer dashboard with status "SLOW"
2. **N+1 patterns** will trigger "N_PLUS_ONE" issues
3. **Execution plans** will be generated for slow queries
4. **Alerts** may be triggered if configured thresholds are exceeded

## Port

- Sample app: 8081
