package com.clinic.doctor_directory_service.doctor.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public record UpdateSpecialtiesRequest(
        @NotEmpty @Size(max = 5) List<@NotBlank String> specialtyCodes,
        @NotBlank String primaryCode) {
}