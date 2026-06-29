package com.queryanalyzer.backend.repository;

import com.queryanalyzer.backend.domain.ExecutionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExecutionPlanRepository extends JpaRepository<ExecutionPlan, UUID> {
    Optional<ExecutionPlan> findByQueryLog_Id(UUID queryLogId);
}
