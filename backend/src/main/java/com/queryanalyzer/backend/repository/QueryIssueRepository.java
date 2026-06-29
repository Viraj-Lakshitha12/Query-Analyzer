package com.queryanalyzer.backend.repository;

import com.queryanalyzer.backend.domain.QueryIssue;
import com.queryanalyzer.backend.domain.QueryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QueryIssueRepository extends JpaRepository<QueryIssue, UUID> {
    boolean existsByQueryLogAndIssueType(QueryLog queryLog, String issueType);
    List<QueryIssue> findByQueryLog_Id(UUID queryLogId);
}
