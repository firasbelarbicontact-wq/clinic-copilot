
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
import java.util.List;
import java.util.Locale;

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

        validateInput(doctorId, date);

        TimeSlot.SlotStatus requestedStatus = null;

        if (status != null && !status.isBlank()) {
            try {
                requestedStatus = TimeSlot.SlotStatus.valueOf(
                        status.trim().toUpperCase(Locale.ROOT));

            } catch (IllegalArgumentException exception) {
                throw new IllegalArgumentException(
                        "Unsupported slot status: " + status,
                        exception);
            }
        }

        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.plusDays(1)
                .atStartOfDay()
                .minusNanos(1);

        final TimeSlot.SlotStatus finalStatus = requestedStatus;

        return timeSlotRepository
                .findByDoctorIdAndStartTimeBetweenOrderByStartTimeAsc(
                        doctorId,
                        dayStart,
                        dayEnd)
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
        validateInput(doctorId, date);

        // 2. Check availability exceptions for this date
        List<AvailabilityException> exceptions =
                availabilityExceptionRepository
                        .findByDoctorIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                                doctorId,
                                date,
                                date);

        if (!exceptions.isEmpty()) {
            return;
        }

        // 3. Retrieve active schedules for this doctor
        List<DoctorSchedule> schedules =
                doctorScheduleRepository.findByDoctorIdAndIsActiveTrue(doctorId);

        if (schedules.isEmpty()) {
            return;
        }

        // 4. Keep schedules matching the requested day
        List<DoctorSchedule> dailySchedules = schedules.stream()
                .filter(schedule ->
                        schedule.getDayOfWeek() == date.getDayOfWeek())
                .toList();

        if (dailySchedules.isEmpty()) {
            return;
        }

        // 5. Retrieve existing slots for the requested date
        LocalDateTime dayStart = date.atStartOfDay();

        LocalDateTime dayEnd = date.plusDays(1)
                .atStartOfDay()
                .minusNanos(1);

        List<TimeSlot> existingSlots =
                timeSlotRepository
                        .findByDoctorIdAndStartTimeBetweenOrderByStartTimeAsc(
                                doctorId,
                                dayStart,
                                dayEnd);

        /*
         * Keep all existing and newly generated slots together.
         * This allows us to detect overlaps both with the database
         * and between schedules processed in this same operation.
         */
        List<TimeSlot> allSlots = new ArrayList<>(existingSlots);

        List<TimeSlot> slotsToSave = new ArrayList<>();

        // 6. Generate slots for every active daily schedule
        for (DoctorSchedule schedule : dailySchedules) {

            validateSchedule(schedule);

            LocalTime start = schedule.getStartTime();
            LocalTime end = schedule.getEndTime();

            int duration = schedule.getSlotDurationMinutes();

            LocalDateTime currentStart = date.atTime(start);
            LocalDateTime scheduleEnd = date.atTime(end);

            // Generate slots while the complete duration fits.
            while (!currentStart.plusMinutes(duration)
                    .isAfter(scheduleEnd)) {

                LocalDateTime currentEnd =
                        currentStart.plusMinutes(duration);

                TimeSlot candidate = new TimeSlot();

                candidate.setDoctorId(doctorId);
                candidate.setScheduleId(schedule.getId());
                candidate.setStartTime(currentStart);
                candidate.setEndTime(currentEnd);
                candidate.setStatus(TimeSlot.SlotStatus.FREE);

                boolean exactDuplicate = false;

                // 7. Check candidate against every existing/generated slot
                for (TimeSlot existing : allSlots) {

                    if (overlaps(
                            candidate.getStartTime(),
                            candidate.getEndTime(),
                            existing.getStartTime(),
                            existing.getEndTime())) {

                        // An identical slot already exists: skip it.
                        if (candidate.getStartTime().equals(existing.getStartTime())
                                && candidate.getEndTime().equals(existing.getEndTime())) {

                            exactDuplicate = true;

                        } else {

                            // Different intervals overlap: reject the schedule.
                            throw new IllegalStateException(
                                    "Overlapping time slots detected for doctor "
                                            + doctorId
                                            + ". Existing interval: "
                                            + existing.getStartTime()
                                            + " - "
                                            + existing.getEndTime()
                                            + ", candidate interval: "
                                            + candidate.getStartTime()
                                            + " - "
                                            + candidate.getEndTime());
                        }
                    }
                }

                // 8. Add only missing, non-overlapping slots
                if (!exactDuplicate) {
                    allSlots.add(candidate);
                    slotsToSave.add(candidate);
                }

                currentStart = currentEnd;
            }
        }

        // 9. Save all generated slots in one operation
        if (!slotsToSave.isEmpty()) {
            timeSlotRepository.saveAll(slotsToSave);
        }
    }

    /**
     * Checks whether two time intervals overlap.
     *
     * Adjacent intervals are allowed:
     * 09:00-09:30 and 09:30-10:00.
     */
    private boolean overlaps(
            LocalDateTime start1,
            LocalDateTime end1,
            LocalDateTime start2,
            LocalDateTime end2) {

        if (start1 == null || end1 == null
                || start2 == null || end2 == null) {

            throw new IllegalStateException(
                    "A time slot contains a null start or end time");
        }

        return start1.isBefore(end2)
                && end1.isAfter(start2);
    }

    /**
     * Validates the doctor's schedule configuration.
     */
    private void validateSchedule(DoctorSchedule schedule) {

        if (schedule == null
                || schedule.getId() == null
                || schedule.getDayOfWeek() == null
                || schedule.getStartTime() == null
                || schedule.getEndTime() == null
                || schedule.getSlotDurationMinutes() == null
                || schedule.getSlotDurationMinutes() <= 0
                || !schedule.getEndTime().isAfter(schedule.getStartTime())) {

            throw new IllegalStateException(
                    "Invalid doctor schedule configuration. Schedule ID: "
                            + (schedule == null ? "null" : schedule.getId()));
        }
    }

    /**
     * Validates the request parameters.
     */
    private void validateInput(Long doctorId, LocalDate date) {

        if (doctorId == null || doctorId <= 0 || date == null) {
            throw new IllegalArgumentException(
                    "A valid doctorId and date are required");
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
