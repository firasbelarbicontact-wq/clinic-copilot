package com.cliniccopilot.records.controller;

import com.cliniccopilot.records.config.AuthUser;
import com.cliniccopilot.records.dto.RecordsDto.ConsultationResponse;
import com.cliniccopilot.records.dto.RecordsDto.CreateConsultationRequest;
import com.cliniccopilot.records.dto.RecordsDto.NoteRequest;
import com.cliniccopilot.records.dto.RecordsDto.NoteResponse;
import com.cliniccopilot.records.service.ConsultationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class ConsultationController {

    private final ConsultationService service;

    public ConsultationController(ConsultationService service) {
        this.service = service;
    }

    @PostMapping("/consultations")
    @ResponseStatus(HttpStatus.CREATED)
    public ConsultationResponse create(@AuthenticationPrincipal AuthUser user,
                                       @Valid @RequestBody CreateConsultationRequest body) {
        return service.create(user, body);
    }

    @GetMapping("/consultations/{id}")
    public ConsultationResponse get(@AuthenticationPrincipal AuthUser user, @PathVariable UUID id) {
        return service.get(user, id);
    }

    @GetMapping("/patients/{patientId}/consultations")
    public List<ConsultationResponse> listForPatient(@AuthenticationPrincipal AuthUser user,
                                                     @PathVariable UUID patientId) {
        return service.listForPatient(user, patientId);
    }

    @PostMapping("/consultations/{id}/notes")
    @ResponseStatus(HttpStatus.CREATED)
    public NoteResponse addNote(@AuthenticationPrincipal AuthUser user, @PathVariable UUID id,
                                @Valid @RequestBody NoteRequest body) {
        return service.addNote(user, id, body);
    }

    @GetMapping("/consultations/{id}/notes")
    public List<NoteResponse> listNotes(@AuthenticationPrincipal AuthUser user, @PathVariable UUID id) {
        return service.listNotes(user, id);
    }
}
