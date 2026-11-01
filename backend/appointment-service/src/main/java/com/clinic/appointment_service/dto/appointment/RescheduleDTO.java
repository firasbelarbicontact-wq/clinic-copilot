package com.clinic.appointment_service.dto.appointment;

import jakarta.validation.constraints.NotNull;

public class RescheduleDTO {
    @NotNull
    private Long newTimeSlotId;
    private String reason;

    public RescheduleDTO() {
    }

    public RescheduleDTO(Long newTimeSlotId, String reason) {
        this.newTimeSlotId = newTimeSlotId;
        this.reason = reason;
    }

    public Long getNewTimeSlotId() { return newTimeSlotId; }
    public void setNewTimeSlotId(Long newTimeSlotId) { this.newTimeSlotId = newTimeSlotId; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}