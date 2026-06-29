package com.queryanalyzer.backend.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "execution_plans")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class ExecutionPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "query_log_id", nullable = false, unique = true)
    private QueryLog queryLog;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "plan_json", columnDefinition = "jsonb")
    private String planJson;

    @Column(name = "scan_type")
    private String scanType;

    @Column(name = "rows_scanned")
    private Long rowsScanned;

    @Column(name = "startup_cost")
    private BigDecimal startupCost;

    @Column(name = "total_cost")
    private BigDecimal totalCost;

    @Column(name = "analyzed_at")
    private Instant analyzedAt;
}
