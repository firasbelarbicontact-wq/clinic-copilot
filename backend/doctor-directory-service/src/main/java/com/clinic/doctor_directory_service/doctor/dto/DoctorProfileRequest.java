package com.clinic.doctor_directory_service.doctor.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record DoctorProfileRequest(
        @NotBlank @Size(max = 80) String firstName,
        @NotBlank @Size(max = 80) String lastName,
        @Size(max = 30) String title,
        @Size(max = 2000) String bio,
        @NotBlank @Size(max = 50) String licenseNumber,
        @Min(0) @Max(70) Integer yearsExperience,
        @Size(max = 30) @Pattern(regexp = "^[+0-9 ()-]*$", message = "Numéro de téléphone invalide") String phone,
        @Size(max = 200) String addressLine,
        @Size(max = 100) String city,
        @Size(max = 100) String governorate,
        @Size(max = 10) String postalCode,
        @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
        @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude) {
}