<<<<<<< HEAD
package com.clinic.appointment_service.entity;

import jakarta.persistence.*;
=======

package com.clinic.appointment_service.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

>>>>>>> origin/main
import java.time.LocalDateTime;

@Entity
@Table(name = "time_slot")
<<<<<<< HEAD
=======
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
>>>>>>> origin/main
public class TimeSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

<<<<<<< HEAD
=======
    @NotNull
>>>>>>> origin/main
    @Column(nullable = false)
    private Long doctorId;

    @Column(name = "schedule_id")
    private Long scheduleId;

<<<<<<< HEAD
    @Column(nullable = false)
    private LocalDateTime startTime;

    @Column(nullable = false)
    private LocalDateTime endTime;

=======
    @NotNull
    @Column(nullable = false)
    private LocalDateTime startTime;

    @NotNull
    @Column(nullable = false)
    private LocalDateTime endTime;

    @NotNull
>>>>>>> origin/main
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private SlotStatus status;

    @Version
    private Long version;

<<<<<<< HEAD
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
=======
    public enum SlotStatus {
        FREE,
        BOOKED,
        BLOCKED
    }
}
>>>>>>> origin/main
