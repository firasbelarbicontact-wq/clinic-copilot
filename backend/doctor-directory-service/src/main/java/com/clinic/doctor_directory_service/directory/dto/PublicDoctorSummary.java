package com.clinic.doctor_directory_service.directory.dto;

import java.util.List;
import java.util.UUID;

import com.clinic.doctor_directory_service.doctor.dto.DoctorProfileResponse.LanguageView;
import com.clinic.doctor_directory_service.doctor.dto.DoctorProfileResponse.SpecialtyView;

public record PublicDoctorSummary(
        UUID id,
        String title,
        String firstName,
        String lastName,
        String city,
        String governorate,
        Integer yearsExperience,
        List<SpecialtyView> specialties,
        List<LanguageView> languages,
        Double distanceKm) {
}