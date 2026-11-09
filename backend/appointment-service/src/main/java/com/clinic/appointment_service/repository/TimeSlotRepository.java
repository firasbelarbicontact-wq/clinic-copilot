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
     * Verrouillage pessimiste pour eviter les doubles reservations.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM TimeSlot t WHERE t.id = :id")
    Optional<TimeSlot> findByIdForUpdate(@Param("id") Long id);

    List<TimeSlot> findByDoctorIdAndStartTimeBetween(Long doctorId,
            LocalDateTime start,
            LocalDateTime end);

    List<TimeSlot> findByDoctorIdAndStatus(Long doctorId, TimeSlot.SlotStatus status);
}