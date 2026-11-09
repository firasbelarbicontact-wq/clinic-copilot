package com.cliniccopilot.records.repository;

import com.cliniccopilot.records.entity.MedicationAdherenceLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MedicationAdherenceLogRepository extends JpaRepository<MedicationAdherenceLog, UUID> {
    List<MedicationAdherenceLog> findByItemIdOrderByScheduledAtDesc(UUID itemId);
}
