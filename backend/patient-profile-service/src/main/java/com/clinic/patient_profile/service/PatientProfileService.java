package com.clinic.patient_profile.service;

import com.clinic.patient_profile.dto.PatientProfileRequest;
import com.clinic.patient_profile.dto.PatientProfileResponse;
import com.clinic.patient_profile.entity.PatientProfile;
import com.clinic.patient_profile.exception.PatientProfileNotFoundException;
import com.clinic.patient_profile.repository.PatientProfileRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class PatientProfileService {

    private final PatientProfileRepository patientProfileRepository;

    public PatientProfileService(
            PatientProfileRepository patientProfileRepository) {
        this.patientProfileRepository = patientProfileRepository;
    }

    // Creates the profile on the first call and updates it afterwards. Only the
    // fields present in the request are changed. Two simultaneous first calls hit
    // the unique constraint on user_id; the handler turns that into a 409.
    @Transactional
    public PatientProfileResponse upsertProfile(
            UUID userId, PatientProfileRequest request) {

        PatientProfile profile = patientProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    PatientProfile created = new PatientProfile();
                    created.setUserId(userId);
                    return created;
                });

        if (request.phoneNumber() != null) {
            profile.setPhoneNumber(request.phoneNumber());
        }
        if (request.address() != null) {
            profile.setAddress(request.address());
        }

        return mapToResponse(patientProfileRepository.save(profile));
    }

    @Transactional(readOnly = true)
    public PatientProfileResponse getProfileByUserId(UUID userId) {
        return mapToResponse(findOrThrow(userId));
    }

    @Transactional
    public void deleteProfile(UUID userId) {
        patientProfileRepository.delete(findOrThrow(userId));
    }

    private PatientProfile findOrThrow(UUID userId) {
        return patientProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new PatientProfileNotFoundException(
                        "Patient profile not found for user: " + userId
                ));
    }

    private PatientProfileResponse mapToResponse(PatientProfile profile) {
        return new PatientProfileResponse(
            profile.getPatientId(),
            profile.getUserId(),
            profile.getPhoneNumber(),
            profile.getAddress()
        );
    }
}