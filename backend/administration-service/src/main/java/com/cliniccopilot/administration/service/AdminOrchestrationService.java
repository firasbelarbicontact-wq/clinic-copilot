package com.cliniccopilot.administration.service;

import com.cliniccopilot.administration.client.AuditServiceClient;
import com.cliniccopilot.administration.client.DoctorDirectoryClient;
import com.cliniccopilot.administration.client.IdentityServiceClient;
import com.cliniccopilot.administration.dto.*;
import com.cliniccopilot.administration.exception.ExternalServiceException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Orchestration des actions administratives : (1) appel du service propriétaire de la donnée,
 * (2) journalisation dans l'Audit Service (SUCCESS ou FAILURE selon le résultat de (1)).
 *
 * Règles :
 *  - L'erreur de l'appel (1) est toujours re-propagée après journalisation FAILURE.
 *  - Un échec de l'Audit Service ne masque jamais le résultat de l'action (best effort, loggé).
 *  - Les métadonnées d'audit ne contiennent JAMAIS de donnée clinique (uniquement statut cible / code HTTP).
 */
@Service
public class AdminOrchestrationService {

    private static final Logger log = LoggerFactory.getLogger(AdminOrchestrationService.class);

    static final String ACTOR_ROLE = "ADMIN";

    private final IdentityServiceClient identityClient;
    private final DoctorDirectoryClient doctorClient;
    private final AuditServiceClient auditClient;
    private final ObjectMapper mapper;

    public AdminOrchestrationService(IdentityServiceClient identityClient, DoctorDirectoryClient doctorClient,
                                     AuditServiceClient auditClient, ObjectMapper mapper) {
        this.identityClient = identityClient;
        this.doctorClient = doctorClient;
        this.auditClient = auditClient;
        this.mapper = mapper;
    }

    public AdminActionResponse changeUserStatus(UUID userId, AccountStatus status, UUID actorId) {
        final String action = "ACCOUNT_STATUS_CHANGED";
        try {
            identityClient.updateUserStatus(userId, status);
        } catch (RuntimeException e) {
            audit(actorId, action, "USER", userId, "FAILURE", metadata("newStatus", status.name(), e));
            throw e;
        }
        audit(actorId, action, "USER", userId, "SUCCESS", metadata("newStatus", status.name(), null));
        return new AdminActionResponse(action, userId, status.name(), Instant.now());
    }

    public AdminActionResponse verifyDoctor(UUID doctorId, VerificationStatus status, String reason, UUID actorId) {
        final String action = status == VerificationStatus.VERIFIED ? "DOCTOR_VERIFIED" : "DOCTOR_REJECTED";
        try {
            doctorClient.updateVerification(doctorId, status, reason);
        } catch (RuntimeException e) {
            audit(actorId, action, "DOCTOR_PROFILE", doctorId, "FAILURE", metadata("newStatus", status.name(), e));
            throw e;
        }
        audit(actorId, action, "DOCTOR_PROFILE", doctorId, "SUCCESS", metadata("newStatus", status.name(), null));
        return new AdminActionResponse(action, doctorId, status.name(), Instant.now());
    }

    private void audit(UUID actorId, String action, String resourceType, UUID resourceId, String result, String metadata) {
        try {
            auditClient.log(new AuditLogRequest(actorId, ACTOR_ROLE, action, resourceType, resourceId, result, metadata));
        } catch (RuntimeException e) {
            // Best effort : on ne masque pas le résultat de l'action métier.
            log.error("Journalisation audit impossible (action={}, resourceId={}, result={}): {}",
                    action, resourceId, result, e.getMessage());
        }
    }

    private String metadata(String key, String value, RuntimeException error) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put(key, value);
        if (error instanceof ExternalServiceException ese) {
            m.put("failedService", ese.getService());
            m.put("upstreamStatus", ese.getUpstreamStatus());
        } else if (error != null) {
            m.put("error", error.getClass().getSimpleName());
        }
        try {
            return mapper.writeValueAsString(m);
        } catch (JsonProcessingException e) {
            return null;
        }
    }
}
