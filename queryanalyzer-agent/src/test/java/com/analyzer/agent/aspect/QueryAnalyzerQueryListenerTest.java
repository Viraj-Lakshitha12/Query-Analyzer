package com.analyzer.agent.aspect;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class QueryAnalyzerQueryListenerTest {

    @Test
    void resolvesCallerFromApplicationStackFrame() {
        StackTraceElement[] stackTrace = Thread.currentThread().getStackTrace();

        QueryAnalyzerQueryListener.CallerInfo caller = QueryAnalyzerQueryListener.resolveCallerFromStack(
                stackTrace,
                "UnknownClass",
                "UnknownMethod"
        );

        assertThat(caller.callerClass()).isNotEqualTo("UnknownClass");
        assertThat(caller.callerMethod()).isNotEqualTo("UnknownMethod");
    }

    @Test
    void fallsBackWhenNoApplicationFrameExists() {
        StackTraceElement[] stackTrace = {
                new StackTraceElement("java.lang.Thread", "run", null, -1)
        };

        QueryAnalyzerQueryListener.CallerInfo caller = QueryAnalyzerQueryListener.resolveCallerFromStack(
                stackTrace,
                "UnknownClass",
                "UnknownMethod"
        );

        assertThat(caller.callerClass()).isEqualTo("UnknownClass");
        assertThat(caller.callerMethod()).isEqualTo("UnknownMethod");
    }
}
