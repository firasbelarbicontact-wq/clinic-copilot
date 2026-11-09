package com.clinic.appointment_service.dto.appointment;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record RescheduleDTO(
        @NotNull @Positive Long newTimeSlotId,
        String reason
) {}