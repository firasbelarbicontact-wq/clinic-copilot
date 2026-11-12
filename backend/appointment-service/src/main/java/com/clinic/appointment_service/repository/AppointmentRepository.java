<<<<<<< HEAD
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
=======

package com.clinic.appointment_service.repository;

import com.clinic.appointment_service.entity.Appointment;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByPatientIdOrderByStartTimeDesc(Long patientId);

    List<Appointment> findByPatientIdAndStartTimeBetween(
            Long patientId,
            LocalDateTime from,
            LocalDateTime to
    );

    List<Appointment> findByDoctorIdAndStartTimeBetween(
            Long doctorId,
            LocalDateTime from,
            LocalDateTime to
    );

    boolean existsByTimeSlotId(Long timeSlotId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Appointment a WHERE a.id = :id")
    Optional<Appointment> findByIdForUpdate(@Param("id") Long id);
}
>>>>>>> origin/main
