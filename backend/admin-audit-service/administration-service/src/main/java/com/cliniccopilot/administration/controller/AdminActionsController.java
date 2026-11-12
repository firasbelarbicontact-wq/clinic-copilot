package com.cliniccopilot.administration.controller;

import com.cliniccopilot.administration.dto.AdminActionResponse;
import com.cliniccopilot.administration.dto.DoctorVerificationRequest;
import com.cliniccopilot.administration.dto.UserStatusRequest;
import com.cliniccopilot.administration.service.AdminOrchestrationService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminActionsController {

    private final AdminOrchestrationService orchestration;

    public AdminActionsController(AdminOrchestrationService orchestration) {
        this.orchestration = orchestration;
    }

    @PatchMapping("/users/{userId}/status")
    public AdminActionResponse changeUserStatus(@PathVariable UUID userId,
                                                @Valid @RequestBody UserStatusRequest body, Authentication auth) {
        return orchestration.changeUserStatus(userId, body.status(), CurrentActor.id(auth));
    }

    @PatchMapping("/doctors/{doctorId}/verification")
    public AdminActionResponse verifyDoctor(@PathVariable UUID doctorId,
                                            @Valid @RequestBody DoctorVerificationRequest body, Authentication auth) {
        return orchestration.verifyDoctor(doctorId, body.status(), body.reason(), CurrentActor.id(auth));
    }
}
