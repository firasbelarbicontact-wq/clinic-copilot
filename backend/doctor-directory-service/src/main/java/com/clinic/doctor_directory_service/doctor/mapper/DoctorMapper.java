package com.clinic.doctor_directory_service.doctor.mapper;

import java.util.Comparator;
import java.util.List;

import com.clinic.doctor_directory_service.doctor.dto.DoctorProfileResponse;
import com.clinic.doctor_directory_service.doctor.dto.DoctorProfileResponse.LanguageView;
import com.clinic.doctor_directory_service.doctor.dto.DoctorProfileResponse.SpecialtyView;
import com.clinic.doctor_directory_service.doctor.entity.Doctor;

public final class DoctorMapper {

    private DoctorMapper() {
    }

    /** À appeler dans une transaction (les spécialités sont chargées à la demande). */
    public static DoctorProfileResponse toResponse(Doctor doctor) {
        List<SpecialtyView> specialties = doctor.getSpecialties().stream()
                .map(link -> new SpecialtyView(
                        link.getSpecialty().getCode(),
                        link.getSpecialty().getName(),
                        link.isPrimarySpecialty()))
                .sorted(Comparator.comparing((SpecialtyView s) -> !s.primary())
                        .thenComparing(SpecialtyView::name))
                .toList();

        List<LanguageView> languages = doctor.getLanguages().stream()
                .map(language -> new LanguageView(language.getCode(), language.getName()))
                .sorted(Comparator.comparing(LanguageView::code))
                .toList();

        return new DoctorProfileResponse(
                doctor.getId(),
                doctor.getFirstName(),
                doctor.getLastName(),
                doctor.getTitle(),
                doctor.getBio(),
                doctor.getLicenseNumber(),
                doctor.getYearsExperience(),
                doctor.getPhone(),
                doctor.getAddressLine(),
                doctor.getCity(),
                doctor.getGovernorate(),
                doctor.getPostalCode(),
                doctor.getLatitude(),
                doctor.getLongitude(),
                doctor.getVerificationStatus(),
                doctor.getProfessionalStatus(),
                specialties,
                languages,
                doctor.getCreatedAt(),
                doctor.getUpdatedAt());
    }
}