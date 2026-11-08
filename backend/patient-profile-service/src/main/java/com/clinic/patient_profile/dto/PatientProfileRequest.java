package com.clinic.patient_profile.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PatientProfileRequest(

    @Size(max = 30, message = "Phone number must be at most 30 characters")
    @Pattern(
        regexp = "^[0-9+()\\-\\s]*$",
        message = "Phone number may only contain digits, spaces, +, -, ( and )"
    )
    String phoneNumber,

    @Size(max = 100, message = "Address must be at most 100 characters")
    String address
) {}
