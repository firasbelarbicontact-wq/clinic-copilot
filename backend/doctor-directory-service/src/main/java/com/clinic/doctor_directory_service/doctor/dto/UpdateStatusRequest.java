package com.clinic.doctor_directory_service.doctor.dto;

import com.clinic.doctor_directory_service.doctor.entity.ProfessionalStatus;

import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(@NotNull ProfessionalStatus status) {
}