package com.cliniccopilot.records.config;

import java.util.UUID;

/** Utilisateur authentifié : "sub" du JWT (UUID) et claim "role". */
public record AuthUser(UUID id, String role) {
    public boolean isDoctor() { return "DOCTOR".equals(role); }
    public boolean isPatient() { return "PATIENT".equals(role); }
}
