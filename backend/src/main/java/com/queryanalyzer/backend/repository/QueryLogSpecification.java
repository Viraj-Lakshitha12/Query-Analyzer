package com.queryanalyzer.backend.repository;

import com.queryanalyzer.backend.domain.QueryLog;
import com.queryanalyzer.backend.dto.QueryLogFilter;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import com.queryanalyzer.backend.domain.QueryIssue;
import jakarta.persistence.criteria.Subquery;
import jakarta.persistence.criteria.Root;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class QueryLogSpecification {

    public static Specification<QueryLog> filterBy(UUID appId, QueryLogFilter filter) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(criteriaBuilder.equal(root.get("app").get("id"), appId));

            // Exclude stale rows inserted by the old pure-AOP aspect (before datasource-proxy was added)
            predicates.add(criteriaBuilder.notLike(
                criteriaBuilder.lower(root.get("sqlText")),
                "%sql unavailable%"
            ));

            if (filter.getStatus() != null && !filter.getStatus().isBlank()) {
                predicates.add(criteriaBuilder.equal(root.get("status"), filter.getStatus()));
            }

            if (filter.getMinDurationMs() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("durationMs"), filter.getMinDurationMs()));
            }

            if (filter.getFrom() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("capturedAt"), filter.getFrom()));
            }

            if (filter.getTo() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("capturedAt"), filter.getTo()));
            }

            if (filter.getSearch() != null && !filter.getSearch().isBlank()) {
                String pattern = "%" + filter.getSearch().toLowerCase() + "%";
                Predicate sqlMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("sqlText")), pattern);
                Predicate tableMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("tableName")), pattern);
                predicates.add(criteriaBuilder.or(sqlMatch, tableMatch));
            }

            if (Boolean.TRUE.equals(filter.getHasIssues())) {
                Subquery<Long> subquery = query.subquery(Long.class);
                Root<QueryIssue> issueRoot = subquery.from(QueryIssue.class);
                subquery.select(criteriaBuilder.count(issueRoot));
                subquery.where(criteriaBuilder.equal(issueRoot.get("queryLog"), root));
                predicates.add(criteriaBuilder.greaterThan(subquery, 0L));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
