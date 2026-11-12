package com.clinic.admin_audit_service.audit.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.clinic.admin_audit_service.audit.dto.AuditEntry;
import com.clinic.admin_audit_service.audit.service.AdminAuditService;

@RestController
@RequestMapping("/api/admin")
public class AdminAuditController {

    private final AdminAuditService adminAuditService;

    public AdminAuditController(AdminAuditService adminAuditService) {
        this.adminAuditService = adminAuditService;
    }

    @GetMapping("/audit")
    public List<AuditEntry> list() {
        return adminAuditService.list();
    }
}
