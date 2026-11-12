package com.clinic.appointment_service.service.availability;

import com.clinic.appointment_service.dto.availability.TimeSlotDTO;
<<<<<<< HEAD
import com.clinic.appointment_service.entity.TimeSlot;
import com.clinic.appointment_service.repository.TimeSlotRepository;
=======
import com.clinic.appointment_service.entity.AvailabilityException;
import com.clinic.appointment_service.entity.DoctorSchedule;
import com.clinic.appointment_service.entity.TimeSlot;
import com.clinic.appointment_service.repository.AvailabilityExceptionRepository;
import com.clinic.appointment_service.repository.DoctorScheduleRepository;
import com.clinic.appointment_service.repository.TimeSlotRepository;

>>>>>>> origin/main
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
<<<<<<< HEAD
import java.util.List;
=======
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
>>>>>>> origin/main

@Service
public class SlotGenerationService {

    private final TimeSlotRepository timeSlotRepository;
<<<<<<< HEAD

    public SlotGenerationService(TimeSlotRepository timeSlotRepository) {
        this.timeSlotRepository = timeSlotRepository;
    }

    @Transactional(readOnly = true)
    public List<TimeSlotDTO> getSlots(Long doctorId, LocalDate date, String status) {
        if (doctorId == null || date == null) {
            throw new IllegalArgumentException("doctorId and date are required");
        }
        LocalDateTime from = date.atStartOfDay();
        LocalDateTime to = date.plusDays(1).atStartOfDay().minusNanos(1);
        return timeSlotRepository.findByDoctorIdAndStartTimeBetween(doctorId, from, to).stream()
                .filter(slot -> status == null || slot.getStatus().name().equalsIgnoreCase(status))
                .map(this::toDto).toList();
    }

    @Transactional
    public void generateSlotsForDoctor(Long doctorId, LocalDate date) {
        if (doctorId == null || date == null) {
            throw new IllegalArgumentException("doctorId and date are required");
=======
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
                        "Unsupported slot status: " + status, exception);
            }
        }

        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime nextDayStart = date.plusDays(1).atStartOfDay();

        final TimeSlot.SlotStatus finalStatus = requestedStatus;

        return timeSlotRepository
                .findByDoctorIdAndStartTimeBetweenOrderByStartTimeAsc(
                        doctorId, dayStart, nextDayStart.minusNanos(1))
                .stream()
                .filter(slot -> finalStatus == null || slot.getStatus() == finalStatus)
                .map(this::toDto)
                .toList();
    }

    /**
     * Generates slots for a doctor on a specific date.
     *
     * The active schedule rows are locked first. Concurrent calls for
     * the same doctor therefore wait for the first generation transaction.
     */
    @Transactional
    public void generateSlotsForDoctor(Long doctorId, LocalDate date) {

        validateInput(doctorId, date);

        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime nextDayStart = date.plusDays(1).atStartOfDay();

        // 1. Lock active schedules for this doctor.
        List<DoctorSchedule> schedules =
                doctorScheduleRepository.findActiveSchedulesForDoctorForUpdate(doctorId);

        // 2. Lock existing slots for this doctor and date.
        List<TimeSlot> existingSlots =
                timeSlotRepository.findByDoctorIdAndStartTimeRangeForUpdate(
                        doctorId, dayStart, nextDayStart);

        // 3. Check whether the doctor has an availability exception.
        List<AvailabilityException> exceptions =
                availabilityExceptionRepository
                        .findByDoctorIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                                doctorId, date, date);

        if (!exceptions.isEmpty()) {
            handleAvailabilityException(existingSlots, doctorId, date);
            return;
        }

        if (schedules.isEmpty()) {
            return;
        }

        // 4. Keep only schedules matching the requested day.
        List<DoctorSchedule> dailySchedules = schedules.stream()
                .filter(schedule -> schedule.getDayOfWeek() == date.getDayOfWeek())
                .toList();

        if (dailySchedules.isEmpty()) {
            return;
        }

        // 5. Detect overlaps against both existing and newly generated slots.
        List<TimeSlot> allSlots = new ArrayList<>(existingSlots);
        List<TimeSlot> slotsToSave = new ArrayList<>();

        for (DoctorSchedule schedule : dailySchedules) {

            validateSchedule(schedule);

            LocalTime start = schedule.getStartTime();
            LocalTime end = schedule.getEndTime();
            int duration = schedule.getSlotDurationMinutes();

            LocalDateTime currentStart = date.atTime(start);
            LocalDateTime scheduleEnd = date.atTime(end);

            while (!currentStart.plusMinutes(duration).isAfter(scheduleEnd)) {

                LocalDateTime currentEnd = currentStart.plusMinutes(duration);

                TimeSlot candidate = new TimeSlot();
                candidate.setDoctorId(doctorId);
                candidate.setScheduleId(schedule.getId());
                candidate.setStartTime(currentStart);
                candidate.setEndTime(currentEnd);
                candidate.setStatus(TimeSlot.SlotStatus.FREE);

                boolean exactDuplicate = false;

                for (TimeSlot existing : allSlots) {

                    if (overlaps(
                            candidate.getStartTime(),
                            candidate.getEndTime(),
                            existing.getStartTime(),
                            existing.getEndTime())) {

                        if (candidate.getStartTime().equals(existing.getStartTime())
                                && candidate.getEndTime().equals(existing.getEndTime())) {
                            exactDuplicate = true;
                        } else {
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

                if (!exactDuplicate) {
                    allSlots.add(candidate);
                    slotsToSave.add(candidate);
                }

                currentStart = currentEnd;
            }
        }

        if (!slotsToSave.isEmpty()) {
            timeSlotRepository.saveAll(slotsToSave);
        }
    }

    /**
     * Blocks free slots when an availability exception covers the date.
     * Existing bookings are not silently cancelled.
     */
    private void handleAvailabilityException(
            List<TimeSlot> existingSlots,
            Long doctorId,
            LocalDate date) {

        boolean hasBookedSlots = existingSlots.stream()
                .anyMatch(slot -> slot.getStatus() == TimeSlot.SlotStatus.BOOKED);

        if (hasBookedSlots) {
            throw new IllegalStateException(
                    "Cannot apply availability exception for doctor "
                            + doctorId + " on " + date
                            + " because booked slots exist. "
                            + "Those appointments must be rescheduled or cancelled first.");
        }

        for (TimeSlot slot : existingSlots) {
            if (slot.getStatus() == TimeSlot.SlotStatus.FREE) {
                slot.setStatus(TimeSlot.SlotStatus.BLOCKED);
            }
        }

        timeSlotRepository.saveAll(existingSlots);
    }

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

        // Adjacent slots are allowed; partial overlaps are not.
        return start1.isBefore(end2) && end1.isAfter(start2);
    }

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

    private void validateInput(Long doctorId, LocalDate date) {

        if (doctorId == null || doctorId <= 0 || date == null) {
            throw new IllegalArgumentException(
                    "A valid doctorId and date are required");
>>>>>>> origin/main
        }
    }

    private TimeSlotDTO toDto(TimeSlot slot) {
<<<<<<< HEAD
        return new TimeSlotDTO(slot.getId(), slot.getDoctorId(), slot.getStartTime(),
                slot.getEndTime(), slot.getStatus().name());
=======

        return new TimeSlotDTO(
                slot.getId(),
                slot.getDoctorId(),
                slot.getStartTime(),
                slot.getEndTime(),
                slot.getStatus().name());
>>>>>>> origin/main
    }
}