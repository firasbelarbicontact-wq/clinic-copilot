<<<<<<< HEAD
=======

>>>>>>> origin/main
package com.clinic.appointment_service.controller;

import com.clinic.appointment_service.dto.appointment.AppointmentResponseDTO;
import com.clinic.appointment_service.dto.appointment.BookAppointmentDTO;
import com.clinic.appointment_service.dto.appointment.RescheduleDTO;
import com.clinic.appointment_service.service.appointment.BookingService;
import com.clinic.appointment_service.service.appointment.CancellationService;
import com.clinic.appointment_service.service.appointment.RescheduleService;
<<<<<<< HEAD
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
=======

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
>>>>>>> origin/main
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@Tag(name = "Appointments", description = "Gestion des rendez-vous")
<<<<<<< HEAD
=======
@Validated
>>>>>>> origin/main
public class AppointmentController {

    private final BookingService bookingService;
    private final CancellationService cancellationService;
    private final RescheduleService rescheduleService;

<<<<<<< HEAD
    public AppointmentController(BookingService bookingService,
=======
    public AppointmentController(
            BookingService bookingService,
>>>>>>> origin/main
            CancellationService cancellationService,
            RescheduleService rescheduleService) {
        this.bookingService = bookingService;
        this.cancellationService = cancellationService;
        this.rescheduleService = rescheduleService;
    }

    @PostMapping
<<<<<<< HEAD
    public ResponseEntity<AppointmentResponseDTO> book(@RequestBody BookAppointmentDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.book(dto));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<AppointmentResponseDTO> cancel(@PathVariable Long id,
            @RequestParam String reason) {
        return ResponseEntity.ok(cancellationService.cancel(id, reason));
    }

    @PostMapping("/{id}/reschedule")
    public ResponseEntity<AppointmentResponseDTO> reschedule(@PathVariable Long id,
            @RequestBody RescheduleDTO dto) {
        return ResponseEntity.ok(rescheduleService.reschedule(id, dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppointmentResponseDTO> getById(@PathVariable Long id) {
=======
    public ResponseEntity<AppointmentResponseDTO> book(
            @Valid @RequestBody BookAppointmentDTO dto) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(bookingService.book(dto));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<AppointmentResponseDTO> cancel(
            @PathVariable Long id,
            @RequestParam @NotBlank String reason) {

        return ResponseEntity.ok(
                cancellationService.cancel(id, reason));
    }

    @PostMapping("/{id}/reschedule")
    public ResponseEntity<AppointmentResponseDTO> reschedule(
            @PathVariable Long id,
            @Valid @RequestBody RescheduleDTO dto) {

        return ResponseEntity.ok(
                rescheduleService.reschedule(id, dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AppointmentResponseDTO> getById(
            @PathVariable Long id) {

>>>>>>> origin/main
        return ResponseEntity.ok(bookingService.getById(id));
    }

    @GetMapping("/patient/{patientId}")
<<<<<<< HEAD
    public ResponseEntity<List<AppointmentResponseDTO>> getByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(bookingService.getByPatient(patientId));
=======
    public ResponseEntity<List<AppointmentResponseDTO>> getByPatient(
            @PathVariable Long patientId) {

        return ResponseEntity.ok(
                bookingService.getByPatient(patientId));
>>>>>>> origin/main
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<List<AppointmentResponseDTO>> getByDoctor(
            @PathVariable Long doctorId,
<<<<<<< HEAD
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(bookingService.getByDoctor(doctorId, from, to));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AppointmentResponseDTO> updateStatus(@PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(bookingService.updateStatus(id, status));
    }
}
=======
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime from,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime to) {

        return ResponseEntity.ok(
                bookingService.getByDoctor(doctorId, from, to));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AppointmentResponseDTO> updateStatus(
            @PathVariable Long id,
            @RequestParam @NotBlank String status) {

        return ResponseEntity.ok(
                bookingService.updateStatus(id, status));
    }
}
>>>>>>> origin/main
