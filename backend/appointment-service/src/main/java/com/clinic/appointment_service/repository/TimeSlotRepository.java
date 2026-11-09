
package com.clinic.appointment_service.repository;

import com.clinic.appointment_service.entity.TimeSlot;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {

    /**
     * Prevent concurrent modifications of the same time slot.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM TimeSlot t WHERE t.id = :id")
    Optional<TimeSlot> findByIdForUpdate(@Param("id") Long id);

    /**
     * Retrieve slots for a doctor within a date range.
     */
    List<TimeSlot> findByDoctorIdAndStartTimeBetweenOrderByStartTimeAsc(
            Long doctorId,
            LocalDateTime start,
            LocalDateTime end
    );

    /**
     * Retrieve slots by doctor and status.
     */
    List<TimeSlot> findByDoctorIdAndStatus(
            Long doctorId,
            TimeSlot.SlotStatus status
    );

    /**
     * Check whether a slot already exists at a given start time.
     */
    boolean existsByDoctorIdAndStartTime(Long doctorId, LocalDateTime startTime);

    /**
     * Retrieve all slots belonging to a doctor's schedule.
     */
    List<TimeSlot> findByScheduleId(Long scheduleId);
}
