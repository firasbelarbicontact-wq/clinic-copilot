package com.cliniccopilot.records.controller;

import com.cliniccopilot.records.config.AuthUser;
import com.cliniccopilot.records.dto.RecordsDto.AdherenceRequest;
import com.cliniccopilot.records.dto.RecordsDto.AdherenceResponse;
import com.cliniccopilot.records.dto.RecordsDto.CreatePlanRequest;
import com.cliniccopilot.records.dto.RecordsDto.PlanResponse;
import com.cliniccopilot.records.dto.RecordsDto.PlanStatusRequest;
import com.cliniccopilot.records.service.MedicationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class MedicationController {

    private final MedicationService service;

    public MedicationController(MedicationService service) {
        this.service = service;
    }

    @PostMapping("/medication-plans")
    @ResponseStatus(HttpStatus.CREATED)
    public PlanResponse create(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody CreatePlanRequest body) {
        return service.createPlan(user, body);
    }

    @GetMapping("/medication-plans/{id}")
    public PlanResponse get(@AuthenticationPrincipal AuthUser user, @PathVariable UUID id) {
        return service.getPlan(user, id);
    }

    @GetMapping("/patients/{patientId}/medication-plans")
    public List<PlanResponse> listForPatient(@AuthenticationPrincipal AuthUser user, @PathVariable UUID patientId) {
        return service.listForPatient(user, patientId);
    }

    @PatchMapping("/medication-plans/{id}/status")
    public PlanResponse changeStatus(@AuthenticationPrincipal AuthUser user, @PathVariable UUID id,
                                     @Valid @RequestBody PlanStatusRequest body) {
        return service.changeStatus(user, id, body.status());
    }

    @PostMapping("/medication-items/{itemId}/adherence")
    @ResponseStatus(HttpStatus.CREATED)
    public AdherenceResponse logAdherence(@AuthenticationPrincipal AuthUser user, @PathVariable UUID itemId,
                                          @Valid @RequestBody AdherenceRequest body) {
        return service.logAdherence(user, itemId, body);
    }

    @GetMapping("/medication-items/{itemId}/adherence")
    public List<AdherenceResponse> listAdherence(@AuthenticationPrincipal AuthUser user, @PathVariable UUID itemId) {
        return service.listAdherence(user, itemId);
    }
}
