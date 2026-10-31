package com.clinic.doctor_directory_service.doctor.dto;

import java.time.Instant;
import java.util.UUID;

import com.clinic.doctor_directory_service.doctor.entity.DiplomaType;
import com.clinic.doctor_directory_service.doctor.entity.VerificationStatus;

public record DiplomaResponse(
        UUID id,
        DiplomaType type,
        String title,
        String institution,
        Integer yearObtained,
        String originalFilename,
        String contentType,
        long sizeBytes,
        VerificationStatus status,
        String rejectionReason,
        Instant uploadedAt,
        Instant reviewedAt) {
}