package com.cliniccopilot.audit.service.spec;

import com.cliniccopilot.audit.entity.AuditLog;
import com.cliniccopilot.audit.enums.ActorRole;
import com.cliniccopilot.audit.enums.AuditResult;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.UUID;

/**
 * Builds a dynamic WHERE clause from whichever filters the admin supplies.
 * Every method returns null when its filter is absent, which Specification
 * treats as "no condition" when combined with Specification.where(...).and(...).
 */
public final class AuditLogSpecifications {

    private AuditLogSpecifications() {
    }

    public static Specification<AuditLog> actorId(UUID actorId) {
        return actorId == null ? null :
                (root, query, cb) -> cb.equal(root.get("actorId"), actorId);
    }

    public static Specification<AuditLog> actorRole(ActorRole actorRole) {
        return actorRole == null ? null :
                (root, query, cb) -> cb.equal(root.get("actorRole"), actorRole);
    }

    public static Specification<AuditLog> action(String action) {
        return (action == null || action.isBlank()) ? null :
                (root, query, cb) -> cb.equal(root.get("action"), action);
    }

    public static Specification<AuditLog> resourceType(String resourceType) {
        return (resourceType == null || resourceType.isBlank()) ? null :
                (root, query, cb) -> cb.equal(root.get("resourceType"), resourceType);
    }

    public static Specification<AuditLog> resourceId(UUID resourceId) {
        return resourceId == null ? null :
                (root, query, cb) -> cb.equal(root.get("resourceId"), resourceId);
    }

    public static Specification<AuditLog> result(AuditResult result) {
        return result == null ? null :
                (root, query, cb) -> cb.equal(root.get("result"), result);
    }

    public static Specification<AuditLog> timestampFrom(Instant from) {
        return from == null ? null :
                (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("timestamp"), from);
    }

    public static Specification<AuditLog> timestampTo(Instant to) {
        return to == null ? null :
                (root, query, cb) -> cb.lessThanOrEqualTo(root.get("timestamp"), to);
    }
}
