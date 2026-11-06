package com.cliniccopilot.administration.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "dashboard_snapshots", indexes = {
        @Index(name = "idx_snapshot_type_period", columnList = "metric_type, period_start, period_end")})
@Getter @Setter @NoArgsConstructor
public class DashboardSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "metric_type", nullable = false, length = 50)
    private MetricType metricType;

    @Column(name = "period_start", nullable = false)
    private Instant periodStart;

    @Column(name = "period_end", nullable = false)
    private Instant periodEnd;

    @Column(name = "metric_value", nullable = false)
    private double value;

    /** JSON texte libre. Jamais de donnée clinique. */
    @Column(columnDefinition = "text")
    private String details;

    @Column(name = "generated_at", nullable = false)
    private Instant generatedAt;

    @PrePersist
    void onCreate() {
        if (generatedAt == null) generatedAt = Instant.now();
    }
}
