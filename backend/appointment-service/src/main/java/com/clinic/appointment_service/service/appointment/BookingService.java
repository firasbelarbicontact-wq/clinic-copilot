
package com.clinic.appointment_service.service.appointment;

import com.clinic.appointment_service.dto.appointment.AppointmentResponseDTO;
import com.clinic.appointment_service.dto.appointment.BookAppointmentDTO;
import com.clinic.appointment_service.entity.Appointment;
import com.clinic.appointment_service.entity.TimeSlot;
import com.clinic.appointment_service.repository.AppointmentRepository;
import com.clinic.appointment_service.repository.TimeSlotRepository;
import com.clinic.appointment_service.service.event.AppointmentEventPublisher;
import com.clinic.appointment_service.service.event.TransactionAfterCommit;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookingService {

    private final AppointmentRepository appointmentRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final AppointmentEventPublisher eventPublisher;

    public BookingService(
            AppointmentRepository appointmentRepository,
            TimeSlotRepository timeSlotRepository,
            AppointmentEventPublisher eventPublisher) {
        this.appointmentRepository = appointmentRepository;
        this.timeSlotRepository = timeSlotRepository;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Books an available time slot for a patient.
     */
    @Transactional
    public AppointmentResponseDTO book(BookAppointmentDTO dto) {

        if (dto == null
                || dto.patientId() == null
                || dto.doctorId() == null
                || dto.timeSlotId() == null) {
            throw new IllegalArgumentException(
                    "patientId, doctorId and timeSlotId are required");
        }

        if (dto.patientId() <= 0
                || dto.doctorId() <= 0
                || dto.timeSlotId() <= 0) {
            throw new IllegalArgumentException("IDs must be positive");
        }

        // Lock the slot to prevent concurrent bookings.
        TimeSlot slot = timeSlotRepository.findByIdForUpdate(dto.timeSlotId())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Time slot not found: " + dto.timeSlotId()));

        // Ensure the slot belongs to the requested doctor.
        if (!dto.doctorId().equals(slot.getDoctorId())) {
            throw new IllegalArgumentException(
                    "The selected time slot does not belong to this doctor");
        }

        // Ensure the slot is available.
        if (slot.getStatus() != TimeSlot.SlotStatus.FREE
                || appointmentRepository.existsByTimeSlotId(slot.getId())) {
            throw new IllegalStateException(
                    "Time slot is not available: " + slot.getId());
        }

        // Validate slot dates.
        LocalDateTime startTime = slot.getStartTime();
        LocalDateTime endTime = slot.getEndTime();

        if (startTime == null || endTime == null
                || !endTime.isAfter(startTime)) {
            throw new IllegalStateException("Invalid time slot dates");
        }

        // Mark slot as booked.
        slot.setStatus(TimeSlot.SlotStatus.BOOKED);
        timeSlotRepository.save(slot);

        // Create appointment.
        Appointment appointment = new Appointment();
        appointment.setPatientId(dto.patientId());
        appointment.setDoctorId(dto.doctorId());
        appointment.setTimeSlotId(slot.getId());
        appointment.setStartTime(startTime);
        appointment.setEndTime(endTime);
        appointment.setStatus(Appointment.AppointmentStatus.BOOKED);
        appointment.setReason(dto.reason());

        Appointment saved = appointmentRepository.save(appointment);

        // Publish booking event only after the transaction commits.
        TransactionAfterCommit.execute(() ->
                eventPublisher.publishBooked(
                        saved.getId(),
                        saved.getPatientId(),
                        saved.getDoctorId(),
                        saved.getStartTime().toString()
                )
        );

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public AppointmentResponseDTO getById(Long id) {

        if (id == null || id <= 0) {
            throw new IllegalArgumentException(
                    "A valid appointment ID is required");
        }

        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Appointment not found: " + id));

        return toDto(appointment);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponseDTO> getByPatient(Long patientId) {

        if (patientId == null || patientId <= 0) {
            throw new IllegalArgumentException(
                    "A valid patient ID is required");
        }

        return appointmentRepository
                .findByPatientIdOrderByStartTimeDesc(patientId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponseDTO> getByDoctor(
            Long doctorId,
            LocalDateTime from,
            LocalDateTime to) {

        if (doctorId == null || doctorId <= 0 || from == null || to == null) {
            throw new IllegalArgumentException(
                    "Valid doctor ID, start date and end date are required");
        }

        if (to.isBefore(from)) {
            throw new IllegalArgumentException(
                    "End date must not be before start date");
        }

        return appointmentRepository
                .findByDoctorIdAndStartTimeBetween(doctorId, from, to)
                .stream()
                .map(this::toDto)
                .toList();
    }

    /**
     * Updates appointment status.
     */
    @Transactional
    public AppointmentResponseDTO updateStatus(Long id, String status) {

        if (id == null || id <= 0) {
            throw new IllegalArgumentException(
                    "A valid appointment ID is required");
        }

        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException(
                    "Appointment status is required");
        }

        Appointment appointment = appointmentRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Appointment not found: " + id));

        Appointment.AppointmentStatus newStatus;

        try {
            newStatus = Appointment.AppointmentStatus.valueOf(
                    status.trim().toUpperCase(java.util.Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException(
                    "Unsupported appointment status: " + status);
        }

        if (newStatus != Appointment.AppointmentStatus.COMPLETED
                && newStatus != Appointment.AppointmentStatus.NO_SHOW) {
            throw new IllegalArgumentException(
                    "Only COMPLETED and NO_SHOW are supported here");
        }

        if (appointment.getStatus() != Appointment.AppointmentStatus.BOOKED
                && appointment.getStatus()
                        != Appointment.AppointmentStatus.RESCHEDULED) {
            throw new IllegalStateException(
                    "Cannot update appointment with status: "
                            + appointment.getStatus());
        }

        appointment.setStatus(newStatus);

        Appointment saved = appointmentRepository.save(appointment);

        // Publish completion event only after the transaction commits.
        if (newStatus == Appointment.AppointmentStatus.COMPLETED) {
            TransactionAfterCommit.execute(() ->
                    eventPublisher.publishCompleted(
                            saved.getId(),
                            saved.getDoctorId()
                    )
            );
        }

        return toDto(saved);
    }

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
