package com.clinic.doctor_directory_service.doctor.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "doctor_status_history")
public class DoctorStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private UUID doctorId;

    @Enumerated(EnumType.STRING)
    private StatusType statusType;

    private String oldValue;
    private String newValue;
    private String changedBy;
    private String reason;
    private Instant changedAt;

    protected DoctorStatusHistory() {
    }

    public DoctorStatusHistory(UUID doctorId, StatusType statusType, String oldValue, String newValue,
            String changedBy, String reason) {
        this.doctorId = doctorId;
        this.statusType = statusType;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.changedBy = changedBy;
        this.reason = reason;
        this.changedAt = Instant.now();
    }

    public Long getId() { return id; }
    public UUID getDoctorId() { return doctorId; }
    public StatusType getStatusType() { return statusType; }
    public String getOldValue() { return oldValue; }
    public String getNewValue() { return newValue; }
    public String getChangedBy() { return changedBy; }
    public String getReason() { return reason; }
    public Instant getChangedAt() { return changedAt; }
}