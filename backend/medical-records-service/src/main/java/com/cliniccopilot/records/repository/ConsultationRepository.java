package com.cliniccopilot.records.repository;

import com.cliniccopilot.records.entity.Consultation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ConsultationRepository extends JpaRepository<Consultation, UUID> {
    List<Consultation> findByPatientIdOrderByConsultedAtDesc(UUID patientId);
    List<Consultation> findByPatientIdAndDoctorIdOrderByConsultedAtDesc(UUID patientId, UUID doctorId);
}
