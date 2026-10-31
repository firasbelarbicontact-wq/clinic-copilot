package com.clinic.doctor_directory_service.directory.dto;

import java.util.List;
import java.util.UUID;

import com.clinic.doctor_directory_service.doctor.dto.DoctorProfileResponse.LanguageView;
import com.clinic.doctor_directory_service.doctor.dto.DoctorProfileResponse.SpecialtyView;

public record PublicDoctorDetail(
        UUID id,
        String title,
        String firstName,
        String lastName,
        String bio,
        Integer yearsExperience,
        String phone,
        String addressLine,
        String city,
        String governorate,
        String postalCode,
        Double latitude,
        Double longitude,
        List<SpecialtyView> specialties,
        List<LanguageView> languages) {
}