package com.clinic.patient_profile.dto;

public record PatientProfileRequest(
    String phoneNumber,
    String address
) {}
