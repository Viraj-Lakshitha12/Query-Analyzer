package com.analyzer.agent.aspect;

import com.analyzer.agent.queue.EventQueueManager;
import lombok.RequiredArgsConstructor;
import net.ttddyy.dsproxy.support.ProxyDataSourceBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

@RequiredArgsConstructor
@Slf4j
public class DataSourceProxyBeanPostProcessor implements BeanPostProcessor {

    private final EventQueueManager queueManager;

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (bean instanceof DataSource && !(bean instanceof net.ttddyy.dsproxy.support.ProxyDataSource)) {
            log.info("QueryAnalyzer wrapping DataSource bean '{}' for SQL interception", beanName);
            return ProxyDataSourceBuilder.create((DataSource) bean)
                    .name("queryanalyzer")
                    .listener(new QueryAnalyzerQueryListener(queueManager))
                    .build();
        }
        return bean;
    }

    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
        return bean;
    }
}
