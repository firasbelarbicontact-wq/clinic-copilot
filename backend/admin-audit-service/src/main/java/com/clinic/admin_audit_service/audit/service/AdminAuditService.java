package com.clinic.admin_audit_service.audit.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.clinic.admin_audit_service.audit.dto.AuditEntry;
import com.clinic.admin_audit_service.audit.dto.AuditKind;

@Service
public class AdminAuditService {

    public List<AuditEntry> list() {
        // Mock data matching the frontend demo store
        List<AuditEntry> list = new ArrayList<>();
        list.add(new AuditEntry("e1", ago(0, 9, 5), "admin@demo.local", AuditKind.AUTH, "Connexion administrateur", "Espace administrateur"));
        list.add(new AuditEntry("e2", ago(1, 17, 30), "admin@demo.local", AuditKind.DOCTOR, "Diplôme validé", "Dr Amel Gharbi · Doctorat en médecine"));
        list.add(new AuditEntry("e3", ago(1, 17, 12), "admin@demo.local", AuditKind.DOCTOR, "Profil médecin vérifié", "Dr Amel Gharbi"));
        list.add(new AuditEntry("e4", ago(2, 11, 40), "système", AuditKind.USER, "Nouveau compte médecin", "Sami Demo"));
        list.add(new AuditEntry("e5", ago(3, 15, 0), "admin@demo.local", AuditKind.REVIEW, "Avis masqué", "Rim A. → Dr Amel Gharbi · Propos injurieux"));
        list.add(new AuditEntry("e6", ago(4, 10, 20), "admin@demo.local", AuditKind.USER, "Compte désactivé", "Anis Bouazizi"));
        list.add(new AuditEntry("e7", ago(5, 9, 45), "admin@demo.local", AuditKind.DOCTOR, "Diplôme refusé", "Dr Test · Document illisible"));
        list.add(new AuditEntry("e8", ago(6, 16, 10), "système", AuditKind.USER, "Nouveau compte patient", "Hela Sassi"));
        return list;
    }

    private String ago(int days, int hour, int min) {
        java.time.ZonedDateTime d = java.time.ZonedDateTime.now(java.time.ZoneOffset.UTC).minusDays(days);
        d = d.withHour(hour).withMinute(min).withSecond(0).withNano(0);
        return d.toString();
    }
}
