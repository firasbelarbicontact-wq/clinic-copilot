package com.cliniccopilot.administration.dto;

import com.cliniccopilot.administration.entity.DashboardSnapshot;
import com.cliniccopilot.administration.entity.MetricType;

import java.time.Instant;
import java.util.UUID;

public record SnapshotResponse(UUID id, MetricType metricType, Instant periodStart, Instant periodEnd,
                               double value, String details, Instant generatedAt) {
    public static SnapshotResponse from(DashboardSnapshot s) {
        return new SnapshotResponse(s.getId(), s.getMetricType(), s.getPeriodStart(), s.getPeriodEnd(),
                s.getValue(), s.getDetails(), s.getGeneratedAt());
    }
}
