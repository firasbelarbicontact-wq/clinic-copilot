package com.clinic.admin_audit_service.audit.dto;

import com.clinic.admin_audit_service.audit.dto.AuditKind;

public class AuditEntry {
    private String id;
    private String at; // ISO timestamp
    private String actor;
    private AuditKind kind;
    private String action;
    private String target;

    public AuditEntry() {}

    public AuditEntry(String id, String at, String actor, AuditKind kind, String action, String target) {
        this.id = id;
        this.at = at;
        this.actor = actor;
        this.kind = kind;
        this.action = action;
        this.target = target;
    }

    // getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getAt() { return at; }
    public void setAt(String at) { this.at = at; }
    public String getActor() { return actor; }
    public void setActor(String actor) { this.actor = actor; }
    public AuditKind getKind() { return kind; }
    public void setKind(AuditKind kind) { this.kind = kind; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getTarget() { return target; }
    public void setTarget(String target) { this.target = target; }
}
