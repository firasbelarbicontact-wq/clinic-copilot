package com.clinic.appointment_service.service.appointment;

import com.clinic.appointment_service.dto.appointment.AppointmentResponseDTO;
import com.clinic.appointment_service.dto.appointment.RescheduleDTO;
import com.clinic.appointment_service.entity.Appointment;
import com.clinic.appointment_service.entity.TimeSlot;
import com.clinic.appointment_service.repository.AppointmentRepository;
import com.clinic.appointment_service.repository.TimeSlotRepository;
import com.clinic.appointment_service.service.event.AppointmentEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RescheduleService {

    private final AppointmentRepository appointmentRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final AppointmentEventPublisher eventPublisher;

    public RescheduleService(AppointmentRepository appointmentRepository,
            TimeSlotRepository timeSlotRepository, AppointmentEventPublisher eventPublisher) {
        this.appointmentRepository = appointmentRepository;
        this.timeSlotRepository = timeSlotRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public AppointmentResponseDTO reschedule(Long id, RescheduleDTO dto) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found: " + id));
        if (dto == null || dto.getNewTimeSlotId() == null) {
            throw new IllegalArgumentException("newTimeSlotId is required");
        }
        TimeSlot newSlot = timeSlotRepository.findByIdForUpdate(dto.getNewTimeSlotId())
                .orElseThrow(() -> new IllegalArgumentException("Time slot not found: " + dto.getNewTimeSlotId()));
        if (newSlot.getStatus() != TimeSlot.SlotStatus.FREE
                || appointmentRepository.existsByTimeSlotId(newSlot.getId())) {
            throw new IllegalStateException("Time slot is not available: " + newSlot.getId());
        }
        var oldStart = appointment.getStartTime();
        if (appointment.getTimeSlotId() != null) {
            timeSlotRepository.findById(appointment.getTimeSlotId()).ifPresent(oldSlot -> {
                oldSlot.setStatus(TimeSlot.SlotStatus.FREE);
                timeSlotRepository.save(oldSlot);
            });
        }
        newSlot.setStatus(TimeSlot.SlotStatus.BOOKED);
        timeSlotRepository.save(newSlot);
        appointment.setTimeSlotId(newSlot.getId());
        appointment.setStartTime(newSlot.getStartTime());
        appointment.setEndTime(newSlot.getEndTime());
        appointment.setStatus(Appointment.AppointmentStatus.RESCHEDULED);
        appointment.setReason(dto.getReason());
        Appointment saved = appointmentRepository.save(appointment);
        eventPublisher.publishRescheduled(
                saved.getId(),
                oldStart.toString(),
                saved.getStartTime().toString());
        return toDto(saved);
    }

    private AppointmentResponseDTO toDto(Appointment appointment) {
        return new AppointmentResponseDTO(
                appointment.getId(), appointment.getPatientId(), appointment.getDoctorId(),
                appointment.getTimeSlotId(), appointment.getStartTime(), appointment.getEndTime(),
                appointment.getStatus().name(), appointment.getReason(),
                appointment.getCreatedAt(), appointment.getUpdatedAt());
    }
}