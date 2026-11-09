package com.cliniccopilot.records.repository;

import com.cliniccopilot.records.entity.ClinicalNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ClinicalNoteRepository extends JpaRepository<ClinicalNote, UUID> {
    List<ClinicalNote> findByConsultationIdOrderByCreatedAtAsc(UUID consultationId);
}
