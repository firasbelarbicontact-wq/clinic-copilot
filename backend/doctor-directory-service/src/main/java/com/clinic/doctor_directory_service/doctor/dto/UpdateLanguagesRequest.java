package com.clinic.doctor_directory_service.doctor.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public record UpdateLanguagesRequest(
        @NotEmpty @Size(max = 10) List<@NotBlank @Size(min = 2, max = 2) String> languageCodes) {
}