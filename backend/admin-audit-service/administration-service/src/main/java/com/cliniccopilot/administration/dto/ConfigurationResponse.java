package com.cliniccopilot.administration.dto;

import com.cliniccopilot.administration.entity.SystemConfiguration;

import java.time.Instant;
import java.util.UUID;

public record ConfigurationResponse(UUID id, String key, String value, String description,
                                    String updatedBy, Instant updatedAt) {
    public static ConfigurationResponse from(SystemConfiguration c) {
        return new ConfigurationResponse(c.getId(), c.getConfigKey(), c.getConfigValue(),
                c.getDescription(), c.getUpdatedBy(), c.getUpdatedAt());
    }
}
