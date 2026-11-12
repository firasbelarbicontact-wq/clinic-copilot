package com.clinic.appointment_service.repository;

import com.clinic.appointment_service.entity.TimeSlot;
import jakarta.persistence.LockModeType;
<<<<<<< HEAD
=======

>>>>>>> origin/main
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {

<<<<<<< HEAD
    /**
     * Verrouillage pessimiste pour eviter les doubles reservations.
     */
=======
>>>>>>> origin/main
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM TimeSlot t WHERE t.id = :id")
    Optional<TimeSlot> findByIdForUpdate(@Param("id") Long id);

<<<<<<< HEAD
    List<TimeSlot> findByDoctorIdAndStartTimeBetween(Long doctorId,
            LocalDateTime start,
            LocalDateTime end);

    List<TimeSlot> findByDoctorIdAndStatus(Long doctorId, TimeSlot.SlotStatus status);
=======
    List<TimeSlot> findByDoctorIdAndStartTimeBetweenOrderByStartTimeAsc(
            Long doctorId,
            LocalDateTime start,
            LocalDateTime end);

    /**
     * Locks all slots for a doctor in the requested date range.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT t
            FROM TimeSlot t
            WHERE t.doctorId = :doctorId
              AND t.startTime >= :start
              AND t.startTime < :end
            ORDER BY t.startTime ASC
            """)
    List<TimeSlot> findByDoctorIdAndStartTimeRangeForUpdate(
            @Param("doctorId") Long doctorId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    List<TimeSlot> findByDoctorIdAndStatus(
            Long doctorId,
            TimeSlot.SlotStatus status);

    boolean existsByDoctorIdAndStartTime(
            Long doctorId,
            LocalDateTime startTime);

    List<TimeSlot> findByScheduleId(Long scheduleId);
>>>>>>> origin/main
}