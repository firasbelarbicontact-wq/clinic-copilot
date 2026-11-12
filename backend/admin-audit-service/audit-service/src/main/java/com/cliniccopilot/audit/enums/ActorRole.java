package com.cliniccopilot.audit.enums;

/**
 * Mirrors the roles defined by Identity Service. Kept as a local enum
 * (not a shared library) since each service owns its own data contracts.
 */
public enum ActorRole {
    GUEST,
    PATIENT,
    DOCTOR,
    ADMIN,
    SYSTEM
}
