package com.cliniccopilot.records.entity;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "medication_items")
public class MedicationItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    public UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    public MedicationPlan plan;

    @Column(nullable = false, length = 150)
    public String name;

    @Column(length = 100)
    public String dosage;

    /** Heures de prise au format HH:mm séparées par des virgules, ex: 08:00,20:00 */
    @Column(name = "schedule_times", nullable = false, length = 200)
    public String scheduleTimes;

    @Column(length = 500)
    public String instructions;
}
