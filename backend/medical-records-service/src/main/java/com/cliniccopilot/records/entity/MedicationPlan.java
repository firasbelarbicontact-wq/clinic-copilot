package com.cliniccopilot.records.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "medication_plans", indexes = @Index(name = "idx_plan_patient", columnList = "patient_id"))
public class MedicationPlan {

    public enum Status { ACTIVE, COMPLETED, CANCELLED }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public UUID id;

    @Column(name = "patient_id", nullable = false)
    public UUID patientId;

    @Column(name = "doctor_id", nullable = false)
    public UUID doctorId;

    @Column(name = "consultation_id")
    public UUID consultationId;

    @Column(nullable = false, length = 150)
    public String title;

    @Column(name = "start_date", nullable = false)
    public LocalDate startDate;

    @Column(name = "end_date")
    public LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    public Status status = Status.ACTIVE;

    @Column(name = "created_at", nullable = false)
    public Instant createdAt;

    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("name")
    public List<MedicationItem> items = new ArrayList<>();

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
