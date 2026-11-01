package com.clinic.appointment_service.service.availability;

import com.clinic.appointment_service.dto.availability.TimeSlotDTO;
import com.clinic.appointment_service.entity.TimeSlot;
import com.clinic.appointment_service.repository.TimeSlotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class SlotGenerationService {

    private final TimeSlotRepository timeSlotRepository;

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
        }
    }

    private TimeSlotDTO toDto(TimeSlot slot) {
        return new TimeSlotDTO(slot.getId(), slot.getDoctorId(), slot.getStartTime(),
                slot.getEndTime(), slot.getStatus().name());
    }
}