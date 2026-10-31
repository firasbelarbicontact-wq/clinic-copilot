package com.clinic.identity_service.dto;

public record LoginRequest(
    String email,
    String password
) {}
