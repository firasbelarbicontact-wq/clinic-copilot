package com.clinic.appointment_service.repository;

import com.clinic.appointment_service.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByPatientIdOrderByStartTimeDesc(Long patientId);

    List<Appointment> findByDoctorIdAndStartTimeBetween(Long doctorId,
            LocalDateTime from,
            LocalDateTime to);

    boolean existsByTimeSlotId(Long timeSlotId);
}