package com.clinic.patient_profile.controller;

import com.clinic.patient_profile.dto.PatientProfileRequest;
import com.clinic.patient_profile.dto.PatientProfileResponse;
import com.clinic.patient_profile.service.PatientProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/patient-profiles")
public class PatientProfileController {

    private final PatientProfileService patientProfileService;

    public PatientProfileController(PatientProfileService patientProfileService) {
        this.patientProfileService = patientProfileService;
    }

     // ---- the logged-in patient (role PATIENT) ----

    @GetMapping("/me")
    public ResponseEntity<PatientProfileResponse> getMyProfile(
        @AuthenticationPrincipal Jwt jwt
    ) {
        return ResponseEntity.ok(
            patientProfileService.getProfileByUserId(userIdOf(jwt))
        );
    }

    @PutMapping("/me")
    public ResponseEntity<PatientProfileResponse> saveMyProfile(
        @AuthenticationPrincipal Jwt jwt,
        @Valid @RequestBody PatientProfileRequest request
    ) {
        return ResponseEntity.ok(
            patientProfileService.upsertProfile(userIdOf(jwt), request)
        );
    }

    // ---- administration (role ADMIN) ----


    @GetMapping("/{userId}")
    public ResponseEntity<PatientProfileResponse> getProfileByUserId(
            @PathVariable UUID userId) {

        return ResponseEntity.ok(patientProfileService.getProfileByUserId(userId));

    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteProfile(
            @PathVariable UUID userId) {

        patientProfileService.deleteProfile(userId);
        return ResponseEntity.noContent().build();
    }


    private UUID userIdOf(Jwt jwt) {
        try {
            return UUID.fromString(jwt.getSubject());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new AccessDeniedException("Invalid token subject");
        }
    }
}
