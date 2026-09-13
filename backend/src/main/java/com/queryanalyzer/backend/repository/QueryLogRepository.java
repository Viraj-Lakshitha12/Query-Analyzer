package com.queryanalyzer.backend.repository;

import com.queryanalyzer.backend.domain.QueryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface QueryLogRepository extends JpaRepository<QueryLog, UUID>, JpaSpecificationExecutor<QueryLog> {
    List<QueryLog> findTop20ByApp_IdOrderByDurationMsDesc(UUID appId);

    @Query("SELECT COALESCE(AVG(q.durationMs), 0) FROM QueryLog q WHERE q.app.id = :appId AND q.capturedAt >= :since")
    double getAverageDurationSince(@Param("appId") UUID appId, @Param("since") Instant since);

    @Query("SELECT COUNT(q) FROM QueryLog q WHERE q.app.id = :appId AND q.status = 'SLOW' AND q.capturedAt >= :since")
    long countSlowQueriesSince(@Param("appId") UUID appId, @Param("since") Instant since);
}
