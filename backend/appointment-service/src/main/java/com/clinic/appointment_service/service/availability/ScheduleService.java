package com.clinic.appointment_service.service.availability;

import com.clinic.appointment_service.dto.availability.AvailabilityExceptionDTO;
import com.clinic.appointment_service.dto.availability.ScheduleDTO;
import com.clinic.appointment_service.entity.AvailabilityException;
import com.clinic.appointment_service.entity.DoctorSchedule;
import com.clinic.appointment_service.repository.AvailabilityExceptionRepository;
import com.clinic.appointment_service.repository.DoctorScheduleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Objects;

@Service
@Transactional
public class ScheduleService {

    private final DoctorScheduleRepository scheduleRepository;
    private final AvailabilityExceptionRepository exceptionRepository;

    public ScheduleService(DoctorScheduleRepository scheduleRepository,
            AvailabilityExceptionRepository exceptionRepository) {
        this.scheduleRepository = scheduleRepository;
        this.exceptionRepository = exceptionRepository;
    }

    public ScheduleDTO createSchedule(Long doctorId, ScheduleDTO dto) {
        validate(doctorId, dto);
        boolean alreadyExists = scheduleRepository.findByDoctorIdAndIsActiveTrue(doctorId).stream()
                .anyMatch(existing -> existing.getDayOfWeek() == dto.getDayOfWeek());
        if (alreadyExists) {
            throw new IllegalStateException(
                    "A schedule already exists for doctor " + doctorId
                            + " and day " + dto.getDayOfWeek());
        }
        DoctorSchedule schedule = toEntity(doctorId, dto);
        return toDto(scheduleRepository.save(schedule));
    }

    public ScheduleDTO updateSchedule(Long doctorId, ScheduleDTO dto) {
        validate(doctorId, dto);
        DoctorSchedule schedule = findScheduleToUpdate(doctorId, dto);
        boolean duplicateDay = scheduleRepository.findByDoctorIdAndIsActiveTrue(doctorId).stream()
                .anyMatch(existing -> !Objects.equals(existing.getId(), schedule.getId())
                        && existing.getDayOfWeek() == dto.getDayOfWeek());
        if (duplicateDay) {
            throw new IllegalStateException(
                    "A schedule already exists for doctor " + doctorId
                            + " and day " + dto.getDayOfWeek());
        }
        schedule.setDayOfWeek(dto.getDayOfWeek());
        schedule.setStartTime(dto.getStartTime());
        schedule.setEndTime(dto.getEndTime());
        schedule.setSlotDurationMinutes(dto.getSlotDurationMinutes());
        schedule.setIsActive(dto.getIsActive() == null || dto.getIsActive());
        return toDto(scheduleRepository.save(schedule));
    }

    public AvailabilityExceptionDTO addException(Long doctorId, AvailabilityExceptionDTO dto) {
        if (doctorId == null || doctorId <= 0 || dto == null || dto.getStartDate() == null
                || dto.getEndDate() == null || dto.getStartDate().isAfter(dto.getEndDate())
                || (dto.getReason() != null && dto.getReason().isBlank())) {
            throw new IllegalArgumentException("A valid availability exception is required");
        }
        boolean overlapsExisting = exceptionRepository.findByDoctorId(doctorId).stream()
                .anyMatch(existing -> !dto.getEndDate().isBefore(existing.getStartDate())
                        && !dto.getStartDate().isAfter(existing.getEndDate()));
        if (overlapsExisting) {
            throw new IllegalStateException(
                    "An availability exception already covers part of this period");
        }
        AvailabilityException exception = new AvailabilityException();
        exception.setDoctorId(doctorId);
        exception.setStartDate(dto.getStartDate());
        exception.setEndDate(dto.getEndDate());
        exception.setReason(dto.getReason());
        return toDto(exceptionRepository.save(exception));
    }

    public void deleteException(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Exception id is required");
        }
        if (!exceptionRepository.existsById(id)) {
            throw new IllegalArgumentException("Availability exception not found: " + id);
        }
        exceptionRepository.deleteById(id);
    }

    private void validate(Long doctorId, ScheduleDTO dto) {
        if (doctorId == null || doctorId <= 0 || dto == null || dto.getDayOfWeek() == null
                || dto.getStartTime() == null || dto.getEndTime() == null
                || !dto.getStartTime().isBefore(dto.getEndTime())
                || dto.getSlotDurationMinutes() == null || dto.getSlotDurationMinutes() <= 0
                || dto.getSlotDurationMinutes() > Duration.between(
                        dto.getStartTime(), dto.getEndTime()).toMinutes()) {
            throw new IllegalArgumentException("A valid doctor schedule is required");
        }
    }

    private DoctorSchedule findScheduleToUpdate(Long doctorId, ScheduleDTO dto) {
        if (dto.getId() != null) {
            DoctorSchedule schedule = scheduleRepository.findById(dto.getId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Schedule not found: " + dto.getId()));
            if (!doctorId.equals(schedule.getDoctorId())) {
                throw new IllegalArgumentException(
                        "Schedule " + dto.getId() + " does not belong to doctor " + doctorId);
            }
            return schedule;
        }

        return scheduleRepository.findByDoctorIdAndIsActiveTrue(doctorId).stream()
                .filter(candidate -> candidate.getDayOfWeek() == dto.getDayOfWeek())
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Schedule not found for doctor " + doctorId
                                + " and day " + dto.getDayOfWeek()));
    }

    private DoctorSchedule toEntity(Long doctorId, ScheduleDTO dto) {
        DoctorSchedule schedule = new DoctorSchedule();
        schedule.setDoctorId(doctorId);
        schedule.setDayOfWeek(dto.getDayOfWeek());
        schedule.setStartTime(dto.getStartTime());
        schedule.setEndTime(dto.getEndTime());
        schedule.setSlotDurationMinutes(dto.getSlotDurationMinutes());
        schedule.setIsActive(dto.getIsActive() == null || dto.getIsActive());
        return schedule;
    }

    private ScheduleDTO toDto(DoctorSchedule schedule) {
        ScheduleDTO dto = new ScheduleDTO();
        dto.setId(schedule.getId());
        dto.setDoctorId(schedule.getDoctorId());
        dto.setDayOfWeek(schedule.getDayOfWeek());
        dto.setStartTime(schedule.getStartTime());
        dto.setEndTime(schedule.getEndTime());
        dto.setSlotDurationMinutes(schedule.getSlotDurationMinutes());
        dto.setIsActive(schedule.getIsActive());
        return dto;
    }

    private AvailabilityExceptionDTO toDto(AvailabilityException exception) {
        AvailabilityExceptionDTO dto = new AvailabilityExceptionDTO();
        dto.setId(exception.getId());
        dto.setDoctorId(exception.getDoctorId());
        dto.setStartDate(exception.getStartDate());
        dto.setEndDate(exception.getEndDate());
        dto.setReason(exception.getReason());
        return dto;
    }
}