
package com.clinic.appointment_service.service.appointment;

import com.clinic.appointment_service.dto.appointment.AppointmentResponseDTO;
import com.clinic.appointment_service.entity.Appointment;
import com.clinic.appointment_service.entity.TimeSlot;
import com.clinic.appointment_service.repository.AppointmentRepository;
import com.clinic.appointment_service.repository.TimeSlotRepository;
import com.clinic.appointment_service.service.event.AppointmentEventPublisher;
import com.clinic.appointment_service.service.event.TransactionAfterCommit;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CancellationService {

    private final AppointmentRepository appointmentRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final AppointmentEventPublisher eventPublisher;

    public CancellationService(
            AppointmentRepository appointmentRepository,
            TimeSlotRepository timeSlotRepository,
            AppointmentEventPublisher eventPublisher) {
        this.appointmentRepository = appointmentRepository;
        this.timeSlotRepository = timeSlotRepository;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Cancels an appointment and releases its time slot.
     */
    @Transactional
    public AppointmentResponseDTO cancel(Long id, String reason) {

        // 1. Validate input
        if (id == null || id <= 0) {
            throw new IllegalArgumentException(
                    "A valid appointment ID is required");
        }

        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException(
                    "Cancellation reason is required");
        }

        // 2. Lock appointment to prevent concurrent modifications
        Appointment appointment = appointmentRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Appointment not found: " + id));

        // 3. Verify appointment status
        if (appointment.getStatus() != Appointment.AppointmentStatus.BOOKED
                && appointment.getStatus()
                        != Appointment.AppointmentStatus.RESCHEDULED) {
            throw new IllegalStateException(
                    "Cannot cancel an appointment with status: "
                            + appointment.getStatus());
        }

        // 4. Release associated time slot
        Long timeSlotId = appointment.getTimeSlotId();

        if (timeSlotId == null) {
            throw new IllegalStateException(
                    "Cannot cancel appointment: no associated time slot found");
        }

        TimeSlot slot = timeSlotRepository.findByIdForUpdate(timeSlotId)
                .orElseThrow(() -> new IllegalStateException(
                        "Associated time slot not found: " + timeSlotId));

        // Verify slot ownership
        if (!appointment.getDoctorId().equals(slot.getDoctorId())) {
            throw new IllegalStateException(
                    "Appointment and time slot doctor IDs do not match");
        }

        if (slot.getStatus() != TimeSlot.SlotStatus.BOOKED) {
            throw new IllegalStateException(
                    "Cannot release a slot that is not BOOKED");
        }

        // 5. Release slot
        slot.setStatus(TimeSlot.SlotStatus.FREE);

        // 6. Clear slot reference because appointment.time_slot_id is UNIQUE.
        // Keep appointment startTime and endTime for historical records.
        appointment.setTimeSlotId(null);

        // 7. Update appointment
        appointment.setStatus(Appointment.AppointmentStatus.CANCELLED);
        appointment.setReason(reason.trim());

        // 8. Save changes
        timeSlotRepository.save(slot);
        Appointment saved = appointmentRepository.save(appointment);

        // 9. Publish cancellation event only after transaction commit
        TransactionAfterCommit.execute(() ->
                eventPublisher.publishCancelled(
                        saved.getId(),
                        saved.getReason()
                )
        );

        return toDto(saved);
    }

    /**
     * Converts an Appointment entity into its response DTO.
     */
    private AppointmentResponseDTO toDto(Appointment appointment) {

        return new AppointmentResponseDTO(
                appointment.getId(),
                appointment.getPatientId(),
                appointment.getDoctorId(),
                appointment.getTimeSlotId(),
                appointment.getStartTime(),
                appointment.getEndTime(),
                appointment.getStatus().name(),
                appointment.getReason()
        );
    }
}
