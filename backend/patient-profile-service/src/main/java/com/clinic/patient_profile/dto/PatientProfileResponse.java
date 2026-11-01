package com.clinic.patient_profile.dto;

import java.util.UUID;

public record PatientProfileResponse(
    UUID id,
    UUID userId,
    String phoneNumber,
    String address
) {}
