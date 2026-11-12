package com.cliniccopilot.records.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "clinical_notes", indexes = @Index(name = "idx_note_consultation", columnList = "consultation_id"))
public class ClinicalNote {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public UUID id;

    @Column(name = "consultation_id", nullable = false)
    public UUID consultationId;

    @Column(name = "author_id", nullable = false)
    public UUID authorId;

    /** Donnée clinique : ne jamais la logger ni l'envoyer à l'Audit Service. */
    @Column(nullable = false, columnDefinition = "text")
    public String content;

    @Column(name = "created_at", nullable = false)
    public Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
