package com.cliniccopilot.records.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/** Champs publics volontairement (code court). patientId, doctorId, appointmentId : références, jamais de clé étrangère inter-services. */
@Entity
@Table(name = "consultations", indexes = {
        @Index(name = "idx_consultation_patient", columnList = "patient_id"),
        @Index(name = "idx_consultation_doctor", columnList = "doctor_id")})
public class Consultation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public UUID id;

    @Column(name = "patient_id", nullable = false)
    public UUID patientId;

    @Column(name = "doctor_id", nullable = false)
    public UUID doctorId;

    @Column(name = "appointment_id")
    public UUID appointmentId;

    @Column(name = "consulted_at", nullable = false)
    public Instant consultedAt;

    @Column(name = "created_at", nullable = false)
    public Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
