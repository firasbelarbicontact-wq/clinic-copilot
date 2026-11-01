package com.clinic.identity_service.dto;

import java.time.LocalDate;

public record RegisterRequest(
    String firstName,
    String lastName,
    String email,
    String password,
    LocalDate dateOfBirth
) {}