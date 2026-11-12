package com.cliniccopilot.records.service;

import com.cliniccopilot.records.client.AuditClient;
import com.cliniccopilot.records.config.AuthUser;
import com.cliniccopilot.records.exception.ForbiddenException;
import org.springframework.stereotype.Component;

import java.util.UUID;

/** Règles d'accès : seuls le patient concerné et le médecin auteur voient un dossier. Tout refus est tracé (DENIED). */
@Component
public class AccessControl {

    private final AuditClient audit;

    public AccessControl(AuditClient audit) {
        this.audit = audit;
    }

    // TODO (à confirmer avec M1/Patient Profile) : vérifier aussi le consentement du patient
    //   (ConsentRecord) avant d'autoriser un médecin à lire un dossier.
    public boolean isParticipant(AuthUser user, UUID patientId, UUID doctorId) {
        return (user.isPatient() && user.id().equals(patientId))
                || (user.isDoctor() && user.id().equals(doctorId));
    }

    public void requireParticipant(AuthUser user, UUID patientId, UUID doctorId,
                                   String action, String resourceType, UUID resourceId) {
        if (!isParticipant(user, patientId, doctorId)) {
            throw deny(user, action, resourceType, resourceId);
        }
    }

    public ForbiddenException deny(AuthUser user, String action, String resourceType, UUID resourceId) {
        audit.log(user, action, resourceType, resourceId, "DENIED");
        return new ForbiddenException("Accès refusé");
    }
}
