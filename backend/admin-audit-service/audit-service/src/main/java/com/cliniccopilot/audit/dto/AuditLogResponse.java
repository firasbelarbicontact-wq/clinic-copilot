package com.cliniccopilot.audit.dto;

import com.cliniccopilot.audit.entity.AuditLog;
import com.cliniccopilot.audit.enums.ActorRole;
import com.cliniccopilot.audit.enums.AuditResult;

import java.time.Instant;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        UUID actorId,
        ActorRole actorRole,
        String action,
        String resourceType,
        UUID resourceId,
        AuditResult result,
        Instant timestamp,
        String metadata
) {
    public static AuditLogResponse fromEntity(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getActorId(),
                log.getActorRole(),
                log.getAction(),
                log.getResourceType(),
                log.getResourceId(),
                log.getResult(),
                log.getTimestamp(),
                log.getMetadata()
        );
    }
}
