package com.clinic.doctor_directory_service.doctor.dto;

import java.time.Instant;
import java.util.UUID;

import com.clinic.doctor_directory_service.doctor.entity.ProfessionalStatus;
import com.clinic.doctor_directory_service.doctor.entity.VerificationStatus;

public record AdminDoctorSummary(
        UUID id,
        String firstName,
        String lastName,
        String licenseNumber,
        String city,
        VerificationStatus verificationStatus,
        ProfessionalStatus professionalStatus,
        Instant createdAt,
        Instant updatedAt) {
}