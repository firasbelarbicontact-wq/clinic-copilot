
package com.clinic.appointment_service.service.appointment;

import com.clinic.appointment_service.dto.appointment.AppointmentResponseDTO;
import com.clinic.appointment_service.dto.appointment.RescheduleDTO;
import com.clinic.appointment_service.entity.Appointment;
import com.clinic.appointment_service.entity.TimeSlot;
import com.clinic.appointment_service.repository.AppointmentRepository;
import com.clinic.appointment_service.repository.TimeSlotRepository;
import com.clinic.appointment_service.service.event.AppointmentEventPublisher;
import com.clinic.appointment_service.service.event.TransactionAfterCommit;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class RescheduleService {

    private final AppointmentRepository appointmentRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final AppointmentEventPublisher eventPublisher;

    public RescheduleService(
            AppointmentRepository appointmentRepository,
            TimeSlotRepository timeSlotRepository,
            AppointmentEventPublisher eventPublisher) {
        this.appointmentRepository = appointmentRepository;
        this.timeSlotRepository = timeSlotRepository;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Reschedules an existing appointment to another available slot.
     */
    @Transactional
    public AppointmentResponseDTO reschedule(Long id, RescheduleDTO dto) {

        // 1. Validate request
        if (id == null || id <= 0) {
            throw new IllegalArgumentException(
                    "A valid appointment ID is required");
        }

        if (dto == null || dto.newTimeSlotId() == null
                || dto.newTimeSlotId() <= 0) {
            throw new IllegalArgumentException(
                    "A valid newTimeSlotId is required");
        }

        // 2. Lock appointment first.
        Appointment appointment = appointmentRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Appointment not found: " + id));

        // 3. Verify appointment status.
        if (appointment.getStatus() != Appointment.AppointmentStatus.BOOKED
                && appointment.getStatus()
                        != Appointment.AppointmentStatus.RESCHEDULED) {
            throw new IllegalStateException(
                    "Cannot reschedule an appointment with status: "
                            + appointment.getStatus());
        }

        // 4. Retrieve current slot ID.
        Long oldSlotId = appointment.getTimeSlotId();
        Long newSlotId = dto.newTimeSlotId();

        if (oldSlotId == null) {
            throw new IllegalStateException(
                    "The appointment has no associated time slot");
        }

        if (oldSlotId.equals(newSlotId)) {
            throw new IllegalArgumentException(
                    "The new time slot must be different from the current slot");
        }

        // 5. Lock both slots in ascending ID order to reduce deadlocks.
        Long firstSlotId = Math.min(oldSlotId, newSlotId);
        Long secondSlotId = Math.max(oldSlotId, newSlotId);

        TimeSlot firstSlot = timeSlotRepository.findByIdForUpdate(firstSlotId)
                .orElseThrow(() -> new IllegalStateException(
                        "Time slot not found: " + firstSlotId));

        TimeSlot secondSlot = timeSlotRepository.findByIdForUpdate(secondSlotId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Time slot not found: " + secondSlotId));

        TimeSlot oldSlot;
        TimeSlot newSlot;

        if (oldSlotId.equals(firstSlotId)) {
            oldSlot = firstSlot;
            newSlot = secondSlot;
        } else {
            oldSlot = secondSlot;
            newSlot = firstSlot;
        }

        // 6. Validate current slot.
        if (!appointment.getDoctorId().equals(oldSlot.getDoctorId())) {
            throw new IllegalStateException(
                    "Appointment and current time slot doctor IDs do not match");
        }

        if (oldSlot.getStatus() != TimeSlot.SlotStatus.BOOKED) {
            throw new IllegalStateException(
                    "The current time slot is not marked as BOOKED");
        }

        // 7. Validate new slot ownership.
        if (!appointment.getDoctorId().equals(newSlot.getDoctorId())) {
            throw new IllegalArgumentException(
                    "The new time slot does not belong to the appointment's doctor");
        }

        // 8. Validate new slot availability.
        if (newSlot.getStatus() != TimeSlot.SlotStatus.FREE
                || appointmentRepository.existsByTimeSlotId(newSlotId)) {
            throw new IllegalStateException(
                    "The new time slot is not available: " + newSlotId);
        }

        // 9. Validate new slot dates.
        LocalDateTime newStart = newSlot.getStartTime();
        LocalDateTime newEnd = newSlot.getEndTime();

        if (newStart == null || newEnd == null
                || !newEnd.isAfter(newStart)) {
            throw new IllegalStateException(
                    "The new time slot has invalid start or end times");
        }

        // 10. Validate existing appointment start time.
        LocalDateTime oldStart = appointment.getStartTime();

        if (oldStart == null) {
            throw new IllegalStateException(
                    "The appointment has no valid previous start time");
        }

        // 11. Release old slot.
        oldSlot.setStatus(TimeSlot.SlotStatus.FREE);

        // 12. Reserve new slot.
        newSlot.setStatus(TimeSlot.SlotStatus.BOOKED);

        timeSlotRepository.save(oldSlot);
        timeSlotRepository.save(newSlot);

        // 13. Update appointment.
        appointment.setTimeSlotId(newSlotId);
        appointment.setStartTime(newStart);
        appointment.setEndTime(newEnd);
        appointment.setStatus(Appointment.AppointmentStatus.RESCHEDULED);

        if (dto.reason() != null && !dto.reason().isBlank()) {
            appointment.setReason(dto.reason().trim());
        }

        Appointment saved = appointmentRepository.save(appointment);

        // 14. Publish rescheduling event only after transaction commit.
        TransactionAfterCommit.execute(() ->
                eventPublisher.publishRescheduled(
                        saved.getId(),
                        oldStart.toString(),
                        saved.getStartTime().toString()
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
