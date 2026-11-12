package com.cliniccopilot.audit.service;

import com.cliniccopilot.audit.dto.AuditLogRequest;
import com.cliniccopilot.audit.dto.AuditLogResponse;
import com.cliniccopilot.audit.entity.AuditLog;
import com.cliniccopilot.audit.enums.ActorRole;
import com.cliniccopilot.audit.enums.AuditResult;
import com.cliniccopilot.audit.repository.AuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceTest {

    @Mock
    private AuditLogRepository repository;

    private AuditLogService service;

    @BeforeEach
    void setUp() {
        service = new AuditLogService(repository);
    }

    @Test
    void record_savesANewAuditLogAndReturnsItsResponse() {
        UUID actorId = UUID.randomUUID();
        AuditLogRequest request = new AuditLogRequest(
                actorId,
                ActorRole.ADMIN,
                "DOCTOR_VERIFIED",
                "DOCTOR_PROFILE",
                UUID.randomUUID(),
                AuditResult.SUCCESS,
                "{\"ip\":\"10.0.0.1\"}"
        );

        when(repository.save(any(AuditLog.class))).thenAnswer(invocation -> {
            AuditLog toSave = invocation.getArgument(0);
            toSave.setId(UUID.randomUUID());
            return toSave;
        });

        AuditLogResponse response = service.record(request);

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(repository).save(captor.capture());

        AuditLog saved = captor.getValue();
        assertThat(saved.getActorId()).isEqualTo(actorId);
        assertThat(saved.getAction()).isEqualTo("DOCTOR_VERIFIED");
        assertThat(saved.getResult()).isEqualTo(AuditResult.SUCCESS);

        assertThat(response.id()).isEqualTo(saved.getId());
        assertThat(response.actorRole()).isEqualTo(ActorRole.ADMIN);
    }

    @Test
    void getById_throwsWhenLogDoesNotExist() {
        UUID missingId = UUID.randomUUID();
        when(repository.findById(missingId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById(missingId))
                .isInstanceOf(NoSuchElementException.class)
                .hasMessageContaining(missingId.toString());
    }
}
