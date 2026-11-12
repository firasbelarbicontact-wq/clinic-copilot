package com.cliniccopilot.records.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "medication_adherence_logs", indexes = @Index(name = "idx_adherence_item", columnList = "item_id"))
public class MedicationAdherenceLog {

    public enum Status { TAKEN, MISSED, SKIPPED }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public UUID id;

    @Column(name = "item_id", nullable = false)
    public UUID itemId;

    @Column(name = "scheduled_at", nullable = false)
    public Instant scheduledAt;

    @Column(name = "taken_at")
    public Instant takenAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    public Status status;

    @Column(name = "logged_at", nullable = false)
    public Instant loggedAt;
}
