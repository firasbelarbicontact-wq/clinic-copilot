package com.clinic.identity_service.dto;

import java.util.UUID;

public record CreatePatientRequest(
    UUID userId,
    String phoneNumber,
    String address
) {}
