package com.clinic.doctor_directory_service.doctor.dto;

import com.clinic.doctor_directory_service.doctor.entity.ProfessionalStatus;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AdminStatusRequest(@NotNull ProfessionalStatus status, @Size(max = 500) String reason) {
}