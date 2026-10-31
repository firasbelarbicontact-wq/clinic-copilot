package com.clinic.doctor_directory_service.doctor.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReviewDiplomaRequest(@NotNull ReviewDecision decision, @Size(max = 500) String reason) {
}