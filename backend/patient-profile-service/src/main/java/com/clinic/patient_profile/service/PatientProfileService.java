package com.clinic.patient_profile.service;

import com.clinic.patient_profile.dto.PatientProfileRequest;
import com.clinic.patient_profile.dto.PatientProfileResponse;
import com.clinic.patient_profile.entity.PatientProfile;
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

    @Transactional
    public PatientProfileResponse createProfile(
            UUID userId, PatientProfileRequest request) {

        if (patientProfileRepository.existsByUserId(userId)) {
            throw new IllegalArgumentException(
                    "A patient profile already exists for this user."
            );
        }

        PatientProfile profile = new PatientProfile();

        profile.setUserId(userId);
        profile.setPhoneNumber(request.phoneNumber());
        profile.setAddress(request.address());

        PatientProfile savedProfile = patientProfileRepository.save(profile);

        return mapToResponse(savedProfile);
    }

    @Transactional(readOnly = true)
    public PatientProfileResponse getProfileByUserId(UUID userId) {

        PatientProfile profile = patientProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Patient profile not found for user: " + userId
                ));

        return mapToResponse(profile);
    }

    @Transactional
    public PatientProfileResponse updateProfile(
            UUID userId, PatientProfileRequest request) {

        PatientProfile profile = patientProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Patient profile not found for user: " + userId
                ));

        profile.setPhoneNumber(request.phoneNumber());
        profile.setAddress(request.address());

        return mapToResponse(patientProfileRepository.save(profile));
    }

    @Transactional
    public void deleteProfile(UUID userId) {

        PatientProfile profile = patientProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Patient profile not found for user: " + userId
                ));

        patientProfileRepository.delete(profile);
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