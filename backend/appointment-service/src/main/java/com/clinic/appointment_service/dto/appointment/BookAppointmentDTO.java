package com.clinic.appointment_service.dto.appointment;

import jakarta.validation.constraints.NotNull;

public class BookAppointmentDTO {
        @NotNull
        private Long patientId;
        @NotNull
        private Long doctorId;
        @NotNull
        private Long timeSlotId;
        private String reason;

        public BookAppointmentDTO() {
        }

        public BookAppointmentDTO(Long patientId, Long doctorId, Long timeSlotId, String reason) {
                this.patientId = patientId;
                this.doctorId = doctorId;
                this.timeSlotId = timeSlotId;
                this.reason = reason;
        }

        public Long getPatientId() { return patientId; }
        public void setPatientId(Long patientId) { this.patientId = patientId; }
        public Long getDoctorId() { return doctorId; }
        public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }
        public Long getTimeSlotId() { return timeSlotId; }
        public void setTimeSlotId(Long timeSlotId) { this.timeSlotId = timeSlotId; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
}