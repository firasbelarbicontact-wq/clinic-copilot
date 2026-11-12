package com.clinic.appointment_service.dto.appointment;

import java.time.LocalDateTime;

<<<<<<< HEAD
public class AppointmentResponseDTO {
        private Long id;
        private Long patientId;
        private Long doctorId;
        private Long timeSlotId;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private String status;
        private String reason;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public AppointmentResponseDTO() {
        }

        public AppointmentResponseDTO(Long id, Long patientId, Long doctorId, Long timeSlotId,
                LocalDateTime startTime, LocalDateTime endTime, String status, String reason,
                LocalDateTime createdAt, LocalDateTime updatedAt) {
                this.id = id;
                this.patientId = patientId;
                this.doctorId = doctorId;
                this.timeSlotId = timeSlotId;
                this.startTime = startTime;
                this.endTime = endTime;
                this.status = status;
                this.reason = reason;
                this.createdAt = createdAt;
                this.updatedAt = updatedAt;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getPatientId() { return patientId; }
        public void setPatientId(Long patientId) { this.patientId = patientId; }
        public Long getDoctorId() { return doctorId; }
        public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }
        public Long getTimeSlotId() { return timeSlotId; }
        public void setTimeSlotId(Long timeSlotId) { this.timeSlotId = timeSlotId; }
        public LocalDateTime getStartTime() { return startTime; }
        public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
        public LocalDateTime getEndTime() { return endTime; }
        public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        public LocalDateTime getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
=======
public record AppointmentResponseDTO(
        Long id,
        Long patientId,
        Long doctorId,
        Long timeSlotId,
        LocalDateTime startTime,
        LocalDateTime endTime,
        String status,
        String reason
) {}
>>>>>>> origin/main
