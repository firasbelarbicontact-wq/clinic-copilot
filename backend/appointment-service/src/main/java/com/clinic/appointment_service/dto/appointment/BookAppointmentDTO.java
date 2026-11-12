package com.clinic.appointment_service.dto.appointment;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record BookAppointmentDTO(
        @NotNull @Positive Long patientId,
        @NotNull @Positive Long doctorId,
        @NotNull @Positive Long timeSlotId,
        String reason
) {}