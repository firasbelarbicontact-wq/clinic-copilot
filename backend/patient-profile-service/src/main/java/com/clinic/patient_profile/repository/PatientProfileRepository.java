package com.clinic.patient_profile.repository;

import com.clinic.patient_profile.entity.PatientProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PatientProfileRepository extends JpaRepository<PatientProfile, UUID> {

    Optional<PatientProfile> findByUserId(UUID userId);

    boolean existsByUserId(UUID userId);
}
