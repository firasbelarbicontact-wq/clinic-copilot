package com.clinic.appointment_service.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "time_slot")
public class TimeSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long doctorId;

    @Column(name = "schedule_id")
    private Long scheduleId;

    @Column(nullable = false)
    private LocalDateTime startTime;

    @Column(nullable = false)
    private LocalDateTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private SlotStatus status;

    @Version
    private Long version;

    public TimeSlot() {
    }

    public TimeSlot(Long id, Long doctorId, Long scheduleId, LocalDateTime startTime,
            LocalDateTime endTime, SlotStatus status, Long version) {
        this.id = id;
        this.doctorId = doctorId;
        this.scheduleId = scheduleId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = status;
        this.version = version;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getDoctorId() { return doctorId; }
    public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }
    public Long getScheduleId() { return scheduleId; }
    public void setScheduleId(Long scheduleId) { this.scheduleId = scheduleId; }
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    public SlotStatus getStatus() { return status; }
    public void setStatus(SlotStatus status) { this.status = status; }
    public Long getVersion() { return version; }

    public enum SlotStatus {
        FREE, BOOKED, BLOCKED
    }
}