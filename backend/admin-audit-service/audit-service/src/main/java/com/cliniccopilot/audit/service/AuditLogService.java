package com.cliniccopilot.audit.service;

import com.cliniccopilot.audit.dto.AuditLogRequest;
import com.cliniccopilot.audit.dto.AuditLogResponse;
import com.cliniccopilot.audit.entity.AuditLog;
import com.cliniccopilot.audit.enums.ActorRole;
import com.cliniccopilot.audit.enums.AuditResult;
import com.cliniccopilot.audit.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.NoSuchElementException;
import java.util.UUID;

import static com.cliniccopilot.audit.service.spec.AuditLogSpecifications.*;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository repository;

    @Transactional
    public AuditLogResponse record(AuditLogRequest request) {
        AuditLog log = AuditLog.builder()
                .actorId(request.actorId())
                .actorRole(request.actorRole())
                .action(request.action())
                .resourceType(request.resourceType())
                .resourceId(request.resourceId())
                .result(request.result())
                .metadata(request.metadata())
                .build();

        AuditLog saved = repository.save(log);
        return AuditLogResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public AuditLogResponse getById(UUID id) {
        AuditLog log = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Audit log not found: " + id));
        return AuditLogResponse.fromEntity(log);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> search(
            UUID actorId,
            ActorRole actorRole,
            String action,
            String resourceType,
            UUID resourceId,
            AuditResult result,
            Instant from,
            Instant to,
            Pageable pageable
    ) {
        Specification<AuditLog> spec = Specification.where(actorId(actorId))
                .and(actorRole(actorRole))
                .and(action(action))
                .and(resourceType(resourceType))
                .and(resourceId(resourceId))
                .and(result(result))
                .and(timestampFrom(from))
                .and(timestampTo(to));

        return repository.findAll(spec, pageable).map(AuditLogResponse::fromEntity);
    }
}
