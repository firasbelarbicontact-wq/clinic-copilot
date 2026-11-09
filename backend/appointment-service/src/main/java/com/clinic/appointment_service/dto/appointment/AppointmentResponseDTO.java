package com.clinic.appointment_service.dto.appointment;

import java.time.LocalDateTime;

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