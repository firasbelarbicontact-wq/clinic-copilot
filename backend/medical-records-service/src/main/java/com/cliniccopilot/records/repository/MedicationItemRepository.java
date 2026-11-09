package com.cliniccopilot.records.repository;

import com.cliniccopilot.records.entity.MedicationItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MedicationItemRepository extends JpaRepository<MedicationItem, UUID> {
}
