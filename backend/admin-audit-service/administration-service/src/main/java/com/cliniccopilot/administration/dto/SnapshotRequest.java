package com.cliniccopilot.administration.dto;

import com.cliniccopilot.administration.entity.MetricType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record SnapshotRequest(
        @NotNull MetricType metricType,
        @NotNull Instant periodStart,
        @NotNull Instant periodEnd,
        @NotNull Double value,
        @Size(max = 4000) String details) {}
