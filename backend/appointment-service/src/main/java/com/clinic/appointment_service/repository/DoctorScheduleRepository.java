package com.clinic.appointment_service.repository;

import com.clinic.appointment_service.entity.DoctorSchedule;
import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DoctorScheduleRepository
        extends JpaRepository<DoctorSchedule, Long> {

    List<DoctorSchedule> findByDoctorIdAndIsActiveTrue(Long doctorId);

    List<DoctorSchedule> findByDoctorId(Long doctorId);

    List<DoctorSchedule> findByDoctorIdAndIsActiveTrueOrderByDayOfWeekAscStartTimeAsc(
            Long doctorId);

    List<DoctorSchedule> findByDoctorIdOrderByDayOfWeekAscStartTimeAsc(
            Long doctorId);

    /**
     * Locks the doctor's active schedules while generating slots.
     * Concurrent generation requests for the same doctor must wait.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT s
            FROM DoctorSchedule s
            WHERE s.doctorId = :doctorId
              AND s.isActive = true
            ORDER BY s.id ASC
            """)
    List<DoctorSchedule> findActiveSchedulesForDoctorForUpdate(
            @Param("doctorId") Long doctorId);
}