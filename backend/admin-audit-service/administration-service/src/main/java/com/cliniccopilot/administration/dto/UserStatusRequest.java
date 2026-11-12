package com.cliniccopilot.administration.dto;

import jakarta.validation.constraints.NotNull;

public record UserStatusRequest(@NotNull AccountStatus status) {}
