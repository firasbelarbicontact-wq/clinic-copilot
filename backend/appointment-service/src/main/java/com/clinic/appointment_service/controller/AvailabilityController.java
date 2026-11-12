package com.clinic.appointment_service.controller;

import com.clinic.appointment_service.dto.availability.AvailabilityExceptionDTO;
import com.clinic.appointment_service.dto.availability.ScheduleDTO;
import com.clinic.appointment_service.dto.availability.TimeSlotDTO;
import com.clinic.appointment_service.service.availability.ScheduleService;
import com.clinic.appointment_service.service.availability.SlotGenerationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/availability")
@Tag(name = "Availability", description = "Gestion des disponibilites des medecins")
public class AvailabilityController {

    private final ScheduleService scheduleService;
    private final SlotGenerationService slotGenerationService;

    public AvailabilityController(ScheduleService scheduleService,
            SlotGenerationService slotGenerationService) {
        this.scheduleService = scheduleService;
        this.slotGenerationService = slotGenerationService;
    }

    @PostMapping("/doctors/{doctorId}/schedule")
    public ResponseEntity<ScheduleDTO> createSchedule(@PathVariable Long doctorId,
            @RequestBody ScheduleDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(scheduleService.createSchedule(doctorId, dto));
    }

    @PutMapping("/doctors/{doctorId}/schedule")
    public ResponseEntity<ScheduleDTO> updateSchedule(@PathVariable Long doctorId,
            @RequestBody ScheduleDTO dto) {
        return ResponseEntity.ok(scheduleService.updateSchedule(doctorId, dto));
    }

    @GetMapping("/doctors/{doctorId}/slots")
    public ResponseEntity<List<TimeSlotDTO>> getSlots(
            @PathVariable Long doctorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(slotGenerationService.getSlots(doctorId, date, status));
    }

    @PostMapping("/doctors/{doctorId}/exceptions")
    public ResponseEntity<AvailabilityExceptionDTO> addException(
            @PathVariable Long doctorId,
            @RequestBody AvailabilityExceptionDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(scheduleService.addException(doctorId, dto));
    }

    @DeleteMapping("/exceptions/{id}")
    public ResponseEntity<Void> deleteException(@PathVariable Long id) {
        scheduleService.deleteException(id);
        return ResponseEntity.noContent().build();
    }
}