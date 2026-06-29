package com.queryanalyzer.backend.repository;

import com.queryanalyzer.backend.domain.QueryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.UUID;

@Repository
public interface QueryLogRepository extends JpaRepository<QueryLog, UUID>, JpaSpecificationExecutor<QueryLog> {
    List<QueryLog> findTop20ByApp_IdOrderByDurationMsDesc(UUID appId);
}
