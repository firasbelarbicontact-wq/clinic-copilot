package com.cliniccopilot.audit.entity;

import com.cliniccopilot.audit.enums.ActorRole;
import com.cliniccopilot.audit.enums.AuditResult;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * A single security / administrative event.
 *
 * IMPORTANT (team rule): this entity must NEVER hold clinical content
 * (symptoms, diagnoses, chat text, medical notes...). It only records
 * WHO did WHAT, WHEN, to WHICH resource, and the result. See README.
 */
@Entity
@Table(name = "audit_logs", indexes = {
        @Index(name = "idx_audit_actor_id", columnList = "actorId"),
        @Index(name = "idx_audit_resource", columnList = "resourceType, resourceId"),
        @Index(name = "idx_audit_timestamp", columnList = "timestamp")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue
    private UUID id;

    /** Reference by ID only to the user in Identity Service. Never a foreign key. */
    @Column(nullable = false)
    private UUID actorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ActorRole actorRole;

    /** e.g. ACCOUNT_DEACTIVATED, DOCTOR_VERIFIED, LOGIN_FAILED, APPOINTMENT_CANCELLED */
    @Column(nullable = false, length = 100)
    private String action;

    /** e.g. USER, DOCTOR_PROFILE, APPOINTMENT, SYSTEM_CONFIGURATION */
    @Column(nullable = false, length = 50)
    private String resourceType;

    private UUID resourceId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AuditResult result;

    @Column(nullable = false, updatable = false)
    private Instant timestamp;

    /**
     * Free-form JSON (IP address, user agent, request id...).
     * Stored as TEXT here for portability; switch the column definition to
     * "jsonb" + hypersistence-utils if the team wants native JSON querying.
     */
    @Column(columnDefinition = "TEXT")
    private String metadata;

    @PrePersist
    void prePersist() {
        if (timestamp == null) {
            timestamp = Instant.now();
        }
    }
}
