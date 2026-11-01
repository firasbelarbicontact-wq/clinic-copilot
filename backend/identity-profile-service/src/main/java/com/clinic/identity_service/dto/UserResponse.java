package com.clinic.identity_service.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import com.clinic.identity_service.entity.Role;

public record UserResponse(
    UUID userId,
    String firstName,
    String lastName,
    String email,
    LocalDate dateOfBirth,
    LocalDateTime createdAt,
    Role role,
    Boolean isActive
) {}
