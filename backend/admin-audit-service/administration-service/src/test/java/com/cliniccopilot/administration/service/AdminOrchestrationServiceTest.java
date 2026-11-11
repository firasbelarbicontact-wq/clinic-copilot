package com.cliniccopilot.administration.service;

import com.cliniccopilot.administration.client.AuditServiceClient;
import com.cliniccopilot.administration.client.DoctorDirectoryClient;
import com.cliniccopilot.administration.client.IdentityServiceClient;
import com.cliniccopilot.administration.dto.*;
import com.cliniccopilot.administration.exception.ExternalServiceException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminOrchestrationServiceTest {

    @Mock IdentityServiceClient identityClient;
    @Mock DoctorDirectoryClient doctorClient;
    @Mock AuditServiceClient auditClient;

    AdminOrchestrationService service;
    final UUID actor = UUID.randomUUID();
    final UUID target = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        service = new AdminOrchestrationService(identityClient, doctorClient, auditClient, new ObjectMapper());
    }

    @Test
    void changeUserStatus_success_callsIdentityThenAuditsSuccess() {
        AdminActionResponse r = service.changeUserStatus(target, AccountStatus.DISABLED, actor);

        InOrder order = inOrder(identityClient, auditClient);
        order.verify(identityClient).updateUserStatus(target, AccountStatus.DISABLED);
        ArgumentCaptor<AuditLogRequest> cap = ArgumentCaptor.forClass(AuditLogRequest.class);
        order.verify(auditClient).log(cap.capture());

        AuditLogRequest a = cap.getValue();
        assertThat(a.result()).isEqualTo("SUCCESS");
        assertThat(a.action()).isEqualTo("ACCOUNT_STATUS_CHANGED");
        assertThat(a.resourceType()).isEqualTo("USER");
        assertThat(a.resourceId()).isEqualTo(target);
        assertThat(a.actorId()).isEqualTo(actor);
        assertThat(a.actorRole()).isEqualTo("ADMIN");
        assertThat(r.newStatus()).isEqualTo("DISABLED");
    }

    @Test
    void changeUserStatus_identityFails_auditsFailureAndRethrows() {
        doThrow(new ExternalServiceException("identity-service", 503, "down", null))
                .when(identityClient).updateUserStatus(target, AccountStatus.ACTIVE);

        assertThatThrownBy(() -> service.changeUserStatus(target, AccountStatus.ACTIVE, actor))
                .isInstanceOf(ExternalServiceException.class);

        ArgumentCaptor<AuditLogRequest> cap = ArgumentCaptor.forClass(AuditLogRequest.class);
        verify(auditClient).log(cap.capture());
        assertThat(cap.getValue().result()).isEqualTo("FAILURE");
        assertThat(cap.getValue().metadata()).contains("503");
    }

    @Test
    void verifyDoctor_success_callsDirectoryThenAuditsDoctorVerified() {
        service.verifyDoctor(target, VerificationStatus.VERIFIED, null, actor);

        InOrder order = inOrder(doctorClient, auditClient);
        order.verify(doctorClient).updateVerification(target, VerificationStatus.VERIFIED, null);
        ArgumentCaptor<AuditLogRequest> cap = ArgumentCaptor.forClass(AuditLogRequest.class);
        order.verify(auditClient).log(cap.capture());
        assertThat(cap.getValue().action()).isEqualTo("DOCTOR_VERIFIED");
        assertThat(cap.getValue().resourceType()).isEqualTo("DOCTOR_PROFILE");
        assertThat(cap.getValue().result()).isEqualTo("SUCCESS");
    }

    @Test
    void verifyDoctor_directoryFails_auditsFailureWithoutLeakingReason() {
        doThrow(new ExternalServiceException("doctor-directory-service", 404, "nf", null))
                .when(doctorClient).updateVerification(any(), any(), any());

        assertThatThrownBy(() -> service.verifyDoctor(target, VerificationStatus.REJECTED, "diplôme illisible", actor))
                .isInstanceOf(ExternalServiceException.class);

        ArgumentCaptor<AuditLogRequest> cap = ArgumentCaptor.forClass(AuditLogRequest.class);
        verify(auditClient).log(cap.capture());
        assertThat(cap.getValue().action()).isEqualTo("DOCTOR_REJECTED");
        assertThat(cap.getValue().result()).isEqualTo("FAILURE");
        assertThat(cap.getValue().metadata()).doesNotContain("diplôme");
    }

    @Test
    void auditFailure_doesNotMaskSuccessfulAction() {
        doThrow(new ExternalServiceException("audit-service", 0, "timeout", null)).when(auditClient).log(any());

        AdminActionResponse r = service.changeUserStatus(target, AccountStatus.DISABLED, actor);

        assertThat(r.newStatus()).isEqualTo("DISABLED");
        verify(identityClient).updateUserStatus(target, AccountStatus.DISABLED);
    }
}
