package com.cliniccopilot.audit.dto;

import com.cliniccopilot.audit.enums.ActorRole;
import com.cliniccopilot.audit.enums.AuditResult;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Payload sent by other services (or by Administration Service) to record
 * one event. This endpoint is called service-to-service, not by end users.
 */
public record AuditLogRequest(

        @NotNull(message = "actorId is required")
        UUID actorId,

        @NotNull(message = "actorRole is required")
        ActorRole actorRole,

        @NotBlank(message = "action is required")
        @Size(max = 100)
        @Pattern(regexp = "^[A-Z][A-Z0-9_]*$", message = "action must be UPPER_SNAKE_CASE")
        String action,

        @NotBlank(message = "resourceType is required")
        @Size(max = 50)
        @Pattern(regexp = "^[A-Z][A-Z0-9_]*$", message = "resourceType must be UPPER_SNAKE_CASE")
        String resourceType,

        UUID resourceId,

        @NotNull(message = "result is required")
        AuditResult result,

        @Size(max = 2000, message = "metadata must be at most 2000 characters")
        String metadata
) {
}