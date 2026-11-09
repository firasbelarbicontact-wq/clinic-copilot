
package com.clinic.appointment_service.service.availability;

import com.clinic.appointment_service.dto.availability.TimeSlotDTO;
import com.clinic.appointment_service.entity.AvailabilityException;
import com.clinic.appointment_service.entity.DoctorSchedule;
import com.clinic.appointment_service.entity.TimeSlot;
import com.clinic.appointment_service.repository.AvailabilityExceptionRepository;
import com.clinic.appointment_service.repository.DoctorScheduleRepository;
import com.clinic.appointment_service.repository.TimeSlotRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class SlotGenerationService {

    private final TimeSlotRepository timeSlotRepository;
    private final DoctorScheduleRepository doctorScheduleRepository;
    private final AvailabilityExceptionRepository availabilityExceptionRepository;

    public SlotGenerationService(
            TimeSlotRepository timeSlotRepository,
            DoctorScheduleRepository doctorScheduleRepository,
            AvailabilityExceptionRepository availabilityExceptionRepository) {

        this.timeSlotRepository = timeSlotRepository;
        this.doctorScheduleRepository = doctorScheduleRepository;
        this.availabilityExceptionRepository = availabilityExceptionRepository;
    }

    /**
     * Retrieves a doctor's time slots for a specific date.
     */
    @Transactional(readOnly = true)
    public List<TimeSlotDTO> getSlots(
            Long doctorId,
            LocalDate date,
            String status) {

        if (doctorId == null || date == null) {
            throw new IllegalArgumentException(
                    "doctorId and date are required");
        }

        TimeSlot.SlotStatus requestedStatus = null;

        if (status != null && !status.isBlank()) {
            try {
                requestedStatus = TimeSlot.SlotStatus.valueOf(
                        status.trim().toUpperCase());
            } catch (IllegalArgumentException exception) {
                throw new IllegalArgumentException(
                        "Unsupported slot status: " + status,
                        exception);
            }
        }

        LocalDateTime from = date.atStartOfDay();
        LocalDateTime to = date.plusDays(1).atStartOfDay().minusNanos(1);

        final TimeSlot.SlotStatus finalStatus = requestedStatus;

        return timeSlotRepository
                .findByDoctorIdAndStartTimeBetweenOrderByStartTimeAsc(doctorId, from, to)
                .stream()
                .filter(slot -> finalStatus == null
                        || slot.getStatus() == finalStatus)
                .map(this::toDto)
                .toList();
    }

    /**
     * Generates time slots based on the doctor's active schedule.
     */
    @Transactional
    public void generateSlotsForDoctor(Long doctorId, LocalDate date) {

        // 1. Validate input
        if (doctorId == null || date == null) {
            throw new IllegalArgumentException(
                    "doctorId and date are required");
        }

        // 2. Check whether the doctor has an availability exception
        List<AvailabilityException> exceptions =
                availabilityExceptionRepository.findByDoctorId(doctorId);

        boolean unavailable = exceptions.stream().anyMatch(exception ->
                !date.isBefore(exception.getStartDate())
                        && !date.isAfter(exception.getEndDate())
        );

        if (unavailable) {
            return;
        }

        // 3. Retrieve active schedules for this doctor
        List<DoctorSchedule> schedules =
                doctorScheduleRepository.findByDoctorIdAndIsActiveTrue(doctorId);

        if (schedules.isEmpty()) {
            return;
        }

        // 4. Find schedules matching the requested day
        List<DoctorSchedule> dailySchedules = schedules.stream()
                .filter(schedule ->
                        schedule.getDayOfWeek() == date.getDayOfWeek())
                .toList();

        if (dailySchedules.isEmpty()) {
            return;
        }

        // 5. Retrieve existing slots for this date
        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.plusDays(1)
                .atStartOfDay()
                .minusNanos(1);

        List<TimeSlot> existingSlots =
                timeSlotRepository.findByDoctorIdAndStartTimeBetweenOrderByStartTimeAsc(
                        doctorId,
                        dayStart,
                        dayEnd
                );

        // Keep existing start times to avoid duplicates.
        Set<LocalDateTime> existingStartTimes = new HashSet<>();

        for (TimeSlot slot : existingSlots) {
            existingStartTimes.add(slot.getStartTime());
        }

        // 6. Generate missing slots
        List<TimeSlot> slotsToSave = new ArrayList<>();

        for (DoctorSchedule schedule : dailySchedules) {

            LocalTime start = schedule.getStartTime();
            LocalTime end = schedule.getEndTime();
            Integer duration = schedule.getSlotDurationMinutes();

            // Validate schedule configuration
            if (start == null || end == null
                    || duration == null || duration <= 0
                    || !end.isAfter(start)) {

                throw new IllegalStateException(
                        "Invalid schedule configuration. Schedule ID: "
                                + schedule.getId());
            }

            LocalDateTime currentStart = date.atTime(start);
            LocalDateTime scheduleEnd = date.atTime(end);

            // Generate slots until the remaining time is insufficient.
            while (!currentStart.plusMinutes(duration)
                    .isAfter(scheduleEnd)) {

                LocalDateTime currentEnd =
                        currentStart.plusMinutes(duration);

                // Avoid duplicate start times, including overlapping schedules.
                if (existingStartTimes.add(currentStart)) {

                    TimeSlot slot = new TimeSlot();

                    slot.setDoctorId(doctorId);
                    slot.setScheduleId(schedule.getId());
                    slot.setStartTime(currentStart);
                    slot.setEndTime(currentEnd);
                    slot.setStatus(TimeSlot.SlotStatus.FREE);

                    slotsToSave.add(slot);
                }

                currentStart = currentEnd;
            }
        }

        // 7. Save generated slots in one operation
        if (!slotsToSave.isEmpty()) {
            timeSlotRepository.saveAll(slotsToSave);
        }
    }

    /**
     * Converts a TimeSlot entity into its DTO.
     */
    private TimeSlotDTO toDto(TimeSlot slot) {

        return new TimeSlotDTO(
                slot.getId(),
                slot.getDoctorId(),
                slot.getStartTime(),
                slot.getEndTime(),
                slot.getStatus().name()
        );
    }
}
