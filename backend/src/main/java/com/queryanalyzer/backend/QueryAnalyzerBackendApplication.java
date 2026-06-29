package com.queryanalyzer.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class QueryAnalyzerBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(QueryAnalyzerBackendApplication.class, args);
    }
}
