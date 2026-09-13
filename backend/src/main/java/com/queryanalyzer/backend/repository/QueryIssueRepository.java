package com.queryanalyzer.backend.repository;

import com.queryanalyzer.backend.domain.QueryIssue;
import com.queryanalyzer.backend.domain.QueryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface QueryIssueRepository extends JpaRepository<QueryIssue, UUID> {
    boolean existsByQueryLogAndIssueType(QueryLog queryLog, String issueType);
    List<QueryIssue> findByQueryLog_Id(UUID queryLogId);

    @Query("SELECT COUNT(qi) FROM QueryIssue qi WHERE qi.queryLog.app.id = :appId AND qi.severity = 'CRITICAL' AND qi.createdAt >= :since")
    long countCriticalIssuesSince(@Param("appId") UUID appId, @Param("since") Instant since);
}
