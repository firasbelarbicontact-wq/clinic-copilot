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
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "availability_exception")
<<<<<<< HEAD
=======
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
>>>>>>> origin/main
public class AvailabilityException {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

<<<<<<< HEAD
    @Column(nullable = false)
    private Long doctorId;

    @Column(nullable = false)
    private LocalDate startDate;

=======
    @NotNull
    @Column(nullable = false)
    private Long doctorId;

    @NotNull
    @Column(nullable = false)
    private LocalDate startDate;

    @NotNull
>>>>>>> origin/main
    @Column(nullable = false)
    private LocalDate endDate;

    private String reason;

<<<<<<< HEAD
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public AvailabilityException() {
    }

    public AvailabilityException(Long id, Long doctorId, LocalDate startDate, LocalDate endDate,
            String reason, LocalDateTime createdAt) {
        this.id = id;
        this.doctorId = doctorId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.reason = reason;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getDoctorId() { return doctorId; }
    public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public LocalDateTime getCreatedAt() { return createdAt; }

=======
    @NotNull
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

>>>>>>> origin/main
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
<<<<<<< HEAD
}
=======
}
>>>>>>> origin/main
