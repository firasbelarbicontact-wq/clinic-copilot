package com.clinic.appointment_service.service.appointment;

import com.clinic.appointment_service.dto.appointment.AppointmentResponseDTO;
import com.clinic.appointment_service.entity.Appointment;
import com.clinic.appointment_service.entity.TimeSlot;
import com.clinic.appointment_service.repository.AppointmentRepository;
import com.clinic.appointment_service.repository.TimeSlotRepository;
import com.clinic.appointment_service.service.event.AppointmentEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CancellationService {

    private final AppointmentRepository appointmentRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final AppointmentEventPublisher eventPublisher;

    public CancellationService(AppointmentRepository appointmentRepository,
            TimeSlotRepository timeSlotRepository, AppointmentEventPublisher eventPublisher) {
        this.appointmentRepository = appointmentRepository;
        this.timeSlotRepository = timeSlotRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public AppointmentResponseDTO cancel(Long id, String reason) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found: " + id));
        appointment.setStatus(Appointment.AppointmentStatus.CANCELLED);
        appointment.setReason(reason);
        appointmentRepository.save(appointment);
        if (appointment.getTimeSlotId() != null) {
            timeSlotRepository.findById(appointment.getTimeSlotId()).ifPresent(slot -> {
                slot.setStatus(TimeSlot.SlotStatus.FREE);
                timeSlotRepository.save(slot);
            });
        }
        eventPublisher.publishCancelled(id, reason);
        return toDto(appointment);
    }

    private AppointmentResponseDTO toDto(Appointment appointment) {
        return new AppointmentResponseDTO(
                appointment.getId(), appointment.getPatientId(), appointment.getDoctorId(),
                appointment.getTimeSlotId(), appointment.getStartTime(), appointment.getEndTime(),
                appointment.getStatus().name(), appointment.getReason(),
                appointment.getCreatedAt(), appointment.getUpdatedAt());
    }
}