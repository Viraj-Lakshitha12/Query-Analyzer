package com.analyzer.agent.config;

import com.analyzer.agent.aspect.DataSourceProxyBeanPostProcessor;
import com.analyzer.agent.queue.EventQueueManager;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * QueryAnalyzerAutoConfiguration
 * ────────────────────────────────
 * Spring Boot auto-configuration for the QueryAnalyzer Agent SDK.
 *
 * Activated only when the target application sets:
 *   queryanalyzer.enabled=true
 *
 * This creates three beans:
 *   1. RestTemplate    — configured with short timeouts for non-blocking flush
 *   2. EventQueueManager — the batch queue that flushes to the backend
 *   3. DataSourceProxyBeanPostProcessor — intercepts DataSource and captures raw SQL
 *
 * Usage in target app's application.yml:
 *   queryanalyzer:
 *     enabled: true
 *     sdk-key: my-loan-app
 *     server-url: http://localhost:8090
 */
@Slf4j
@AutoConfiguration
@ConditionalOnProperty(name = "queryanalyzer.enabled", havingValue = "true")
@EnableConfigurationProperties(QueryAnalyzerProperties.class)
public class QueryAnalyzerAutoConfiguration {

    /**
     * RestTemplate with short timeouts — flush calls should be fast,
     * and we never want to block the target app's threads.
     */
    @Bean("queryAnalyzerRestTemplate")
    public RestTemplate queryAnalyzerRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);  // 3s connect timeout
        factory.setReadTimeout(5000);     // 5s read timeout

        RestTemplate restTemplate = new RestTemplate(factory);
        log.debug("QueryAnalyzer RestTemplate created with connect=3s, read=5s timeouts");
        return restTemplate;
    }

    /**
     * The batch queue manager — accumulates events and flushes to the backend.
     */
    @Bean
    public EventQueueManager eventQueueManager(
            QueryAnalyzerProperties properties,
            RestTemplate queryAnalyzerRestTemplate) {
        return new EventQueueManager(properties, queryAnalyzerRestTemplate);
    }

    /**
     * Intercepts DataSource bean and wraps it in a proxy to capture raw parameterized SQL.
     */
    @Bean
    public DataSourceProxyBeanPostProcessor dataSourceProxyBeanPostProcessor(EventQueueManager eventQueueManager) {
        log.info("QueryAnalyzer Agent activated — intercepting DataSource for raw SQL capture");
        return new DataSourceProxyBeanPostProcessor(eventQueueManager);
    }
}
