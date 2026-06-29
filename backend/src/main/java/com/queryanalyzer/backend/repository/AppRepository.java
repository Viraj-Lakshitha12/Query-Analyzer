package com.queryanalyzer.backend.repository;

import com.queryanalyzer.backend.domain.App;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AppRepository extends JpaRepository<App, UUID> {
    Optional<App> findBySdkKey(String sdkKey);
    List<App> findByOwnerIdAndActiveTrue(UUID ownerId);
}
