package com.clinic.patient_profile.controller;

import com.clinic.patient_profile.dto.PatientProfileRequest;
import com.clinic.patient_profile.dto.PatientProfileResponse;
import com.clinic.patient_profile.entity.PatientProfile;
import com.clinic.patient_profile.service.PatientProfileService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/patient-profiles")
public class PatientProfileController {

    private final PatientProfileService patientProfileService;

    public PatientProfileController(PatientProfileService patientProfileService) {
        this.patientProfileService = patientProfileService;
    }

    @PostMapping
    public ResponseEntity<PatientProfileResponse> createProfile(
        @RequestParam UUID userId,
        @RequestBody PatientProfileRequest request) {

    PatientProfileResponse createdProfile =
            patientProfileService.createProfile(userId, request);

    return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(createdProfile);
}

    @GetMapping("/{userId}")
    public ResponseEntity<PatientProfileResponse> getProfileByUserId(
            @PathVariable UUID userId) {

        PatientProfileResponse profile = patientProfileService.getProfileByUserId(userId);

        return ResponseEntity.ok(profile);
    }

    @PutMapping("/{userId}")
    public ResponseEntity<PatientProfileResponse> updateProfile(
        @PathVariable UUID userId,
        @RequestBody PatientProfileRequest request) {

    PatientProfileResponse response =
            patientProfileService.updateProfile(userId, request);

    return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteProfile(
            @PathVariable UUID userId) {

        patientProfileService.deleteProfile(userId);

        return ResponseEntity.noContent().build();
    }
}
