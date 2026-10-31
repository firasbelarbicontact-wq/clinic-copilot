package com.clinic.doctor_directory_service.doctor.dto;

import java.time.Instant;

import com.clinic.doctor_directory_service.doctor.entity.StatusType;

public record StatusHistoryResponse(
        StatusType statusType,
        String oldValue,
        String newValue,
        String changedBy,
        String reason,
        Instant changedAt) {
}
