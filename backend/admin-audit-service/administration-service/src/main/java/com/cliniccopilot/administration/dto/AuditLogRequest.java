package com.cliniccopilot.administration.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.UUID;

/** Corps conforme au contrat de l'Audit Service (POST /api/v1/audit-logs). */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuditLogRequest(UUID actorId, String actorRole, String action, String resourceType,
                              UUID resourceId, String result, String metadata) {}
