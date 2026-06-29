package com.analyzer.agent.aspect;

import com.analyzer.agent.dto.QueryEventRequest;
import com.analyzer.agent.queue.EventQueueManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.ttddyy.dsproxy.ExecutionInfo;
import net.ttddyy.dsproxy.QueryInfo;
import net.ttddyy.dsproxy.listener.QueryExecutionListener;

import java.time.Instant;
import java.util.List;
import java.util.Locale;

@Slf4j
@RequiredArgsConstructor
public class QueryAnalyzerQueryListener implements QueryExecutionListener {

    private final EventQueueManager queueManager;

    @Override
    public void beforeQuery(ExecutionInfo execInfo, List<QueryInfo> queryInfoList) {
        // Nothing to do before query execution
    }

    @Override
    public void afterQuery(ExecutionInfo execInfo, List<QueryInfo> queryInfoList) {
        try {
            for (QueryInfo queryInfo : queryInfoList) {
                String sql = queryInfo.getQuery();
                log.info(">>>> [TEST] QueryAnalyzer intercepted a query: {}", sql);
                // 1. Guard against blank or null SQL
                if (sql == null || sql.trim().isEmpty()) {
                    continue;
                }

                CallerInfo callerInfo = resolveCallerFromStack(
                        Thread.currentThread().getStackTrace(),
                        "UnknownClass",
                        "UnknownMethod"
                );

                // 2. Build Event
                QueryEventRequest event = QueryEventRequest.builder()
                        .callerClass(callerInfo.callerClass())
                        .callerMethod(callerInfo.callerMethod())
                        .durationMs(execInfo.getElapsedTime())
                        .sqlText(sql)
                        .capturedAt(Instant.now().toString())
                        .build();

                // 3. Queue it
                queueManager.offer(event);
            }
        } catch (Exception e) {
            log.trace("QueryAnalyzer interceptor error (non-fatal): {}", e.getMessage());
        }
    }

    static CallerInfo resolveCallerFromStack(StackTraceElement[] stackTrace, String fallbackClass, String fallbackMethod) {
        for (StackTraceElement frame : stackTrace) {
            String className = frame.getClassName();
            if (className == null || className.startsWith("java.") || className.startsWith("javax.")
                    || className.startsWith("jakarta.") || className.startsWith("sun.")
                    || className.startsWith("com.sun.") || className.startsWith("org.springframework.")
                    || className.startsWith("org.hibernate.") || className.startsWith("net.ttddyy.")
                    || className.startsWith("com.analyzer.agent")) {
                continue;
            }

            String methodName = frame.getMethodName();
            if (methodName == null || methodName.isBlank()) {
                methodName = fallbackMethod;
            }

            return new CallerInfo(className, methodName);
        }

        return new CallerInfo(fallbackClass, fallbackMethod);
    }

    record CallerInfo(String callerClass, String callerMethod) {
    }
}
