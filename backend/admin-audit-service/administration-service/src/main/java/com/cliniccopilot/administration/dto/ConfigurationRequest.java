package com.cliniccopilot.administration.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ConfigurationRequest(
        @NotNull @Size(max = 4000) String value,
        @Size(max = 500) String description) {}
