package com.clinic.appointment_service.service.appointment;

import com.clinic.appointment_service.dto.appointment.AppointmentResponseDTO;
import com.clinic.appointment_service.dto.appointment.BookAppointmentDTO;
import com.clinic.appointment_service.entity.Appointment;
import com.clinic.appointment_service.entity.TimeSlot;
import com.clinic.appointment_service.repository.AppointmentRepository;
import com.clinic.appointment_service.repository.TimeSlotRepository;
import com.clinic.appointment_service.service.event.AppointmentEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookingService {

    private final AppointmentRepository appointmentRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final AppointmentEventPublisher eventPublisher;

    public BookingService(AppointmentRepository appointmentRepository,
            TimeSlotRepository timeSlotRepository, AppointmentEventPublisher eventPublisher) {
        this.appointmentRepository = appointmentRepository;
        this.timeSlotRepository = timeSlotRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public AppointmentResponseDTO book(BookAppointmentDTO dto) {
        if (dto == null || dto.getPatientId() == null || dto.getDoctorId() == null
                || dto.getTimeSlotId() == null) {
            throw new IllegalArgumentException("patientId, doctorId and timeSlotId are required");
        }
        TimeSlot slot = timeSlotRepository.findByIdForUpdate(dto.getTimeSlotId())
                .orElseThrow(() -> new IllegalArgumentException("Time slot not found: " + dto.getTimeSlotId()));
        if (slot.getStatus() != TimeSlot.SlotStatus.FREE
                || appointmentRepository.existsByTimeSlotId(slot.getId())) {
            throw new IllegalStateException("Time slot is not available: " + slot.getId());
        }
        slot.setStatus(TimeSlot.SlotStatus.BOOKED);
        timeSlotRepository.save(slot);
        Appointment appointment = new Appointment();
        appointment.setPatientId(dto.getPatientId());
        appointment.setDoctorId(dto.getDoctorId());
        appointment.setTimeSlotId(slot.getId());
        appointment.setStartTime(slot.getStartTime());
        appointment.setEndTime(slot.getEndTime());
        appointment.setStatus(Appointment.AppointmentStatus.BOOKED);
        appointment.setReason(dto.getReason());
        Appointment saved = appointmentRepository.save(appointment);
        eventPublisher.publishBooked(
                saved.getId(),
                saved.getPatientId(),
                saved.getDoctorId(),
                saved.getStartTime().toString());
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public AppointmentResponseDTO getById(Long id) {
        return toDto(appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found: " + id)));
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponseDTO> getByPatient(Long patientId) {
        return appointmentRepository.findByPatientIdOrderByStartTimeDesc(patientId)
                .stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponseDTO> getByDoctor(Long doctorId,
            LocalDateTime from,
            LocalDateTime to) {
        return appointmentRepository.findByDoctorIdAndStartTimeBetween(doctorId, from, to)
                .stream().map(this::toDto).toList();
    }

    @Transactional
    public AppointmentResponseDTO updateStatus(Long id, String status) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found: " + id));
        Appointment.AppointmentStatus newStatus;
        try {
            newStatus = Appointment.AppointmentStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Unsupported appointment status: " + status, exception);
        }
        appointment.setStatus(newStatus);
        Appointment saved = appointmentRepository.save(appointment);
        if (newStatus == Appointment.AppointmentStatus.COMPLETED) {
            eventPublisher.publishCompleted(saved.getId(), saved.getDoctorId());
        }
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