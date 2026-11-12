package com.cliniccopilot.audit.controller;

import com.cliniccopilot.audit.dto.AuditLogRequest;
import com.cliniccopilot.audit.dto.AuditLogResponse;
import com.cliniccopilot.audit.enums.ActorRole;
import com.cliniccopilot.audit.enums.AuditResult;
import com.cliniccopilot.audit.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
@Tag(name = "Audit Logs", description = "Write and query security / administrative events")
public class AuditLogController {

    private final AuditLogService auditLogService;

    /**
     * Called by other backend services (directly, or via an event consumer)
     * to record one event. Protected by the internal API key, not by a user
     * JWT -- see SecurityConfig.
     */
    @PostMapping
    @Operation(summary = "Record one audit event (service-to-service call)")
    public ResponseEntity<AuditLogResponse> record(@Valid @RequestBody AuditLogRequest request) {
        AuditLogResponse response = auditLogService.record(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Admin-only search. Every filter is optional; absent filters are
     * simply not applied (see AuditLogSpecifications).
     */
    @GetMapping
    @Operation(summary = "Search audit events (ADMIN only)")
    public ResponseEntity<Page<AuditLogResponse>> search(
            @RequestParam(required = false) UUID actorId,
            @RequestParam(required = false) ActorRole actorRole,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) UUID resourceId,
            @RequestParam(required = false) AuditResult result,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            Pageable pageable
    ) {
        Page<AuditLogResponse> page = auditLogService.search(
                actorId, actorRole, action, resourceType, resourceId, result, from, to, pageable);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get one audit event by id (ADMIN only)")
    public ResponseEntity<AuditLogResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(auditLogService.getById(id));
    }
}
