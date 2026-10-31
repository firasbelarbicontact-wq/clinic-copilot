package com.clinic.doctor_directory_service.doctor.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.clinic.doctor_directory_service.doctor.entity.ProfessionalStatus;
import com.clinic.doctor_directory_service.doctor.entity.VerificationStatus;

public record DoctorProfileResponse(
        UUID id,
        String firstName,
        String lastName,
        String title,
        String bio,
        String licenseNumber,
        Integer yearsExperience,
        String phone,
        String addressLine,
        String city,
        String governorate,
        String postalCode,
        Double latitude,
        Double longitude,
        VerificationStatus verificationStatus,
        ProfessionalStatus professionalStatus,
        List<SpecialtyView> specialties,
        List<LanguageView> languages,
        Instant createdAt,
        Instant updatedAt) {

    public record SpecialtyView(String code, String name, boolean primary) {
    }

    public record LanguageView(String code, String name) {
    }
}