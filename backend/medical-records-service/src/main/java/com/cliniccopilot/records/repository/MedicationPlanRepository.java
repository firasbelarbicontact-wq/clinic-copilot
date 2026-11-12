package com.cliniccopilot.records.repository;

import com.cliniccopilot.records.entity.MedicationPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MedicationPlanRepository extends JpaRepository<MedicationPlan, UUID> {
    List<MedicationPlan> findByPatientIdOrderByCreatedAtDesc(UUID patientId);
    List<MedicationPlan> findByPatientIdAndDoctorIdOrderByCreatedAtDesc(UUID patientId, UUID doctorId);
}
