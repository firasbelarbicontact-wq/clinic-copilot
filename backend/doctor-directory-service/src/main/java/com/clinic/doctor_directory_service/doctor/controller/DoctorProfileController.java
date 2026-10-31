package com.clinic.doctor_directory_service.doctor.controller;

import java.net.URI;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.clinic.doctor_directory_service.doctor.dto.DoctorProfileRequest;
import com.clinic.doctor_directory_service.doctor.dto.DoctorProfileResponse;
import com.clinic.doctor_directory_service.doctor.service.DoctorService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/doctors/me")
public class DoctorProfileController {

    private final DoctorService doctorService;

    public DoctorProfileController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @PostMapping
    public ResponseEntity<DoctorProfileResponse> create(@Valid @RequestBody DoctorProfileRequest request) {
        DoctorProfileResponse created = doctorService.createMyProfile(request);
        return ResponseEntity.created(URI.create("/api/doctors/me")).body(created);
    }

    @GetMapping
    public DoctorProfileResponse get() {
        return doctorService.getMyProfile();
    }

    @PutMapping
    public DoctorProfileResponse update(@Valid @RequestBody DoctorProfileRequest request) {
        return doctorService.updateMyProfile(request);
    }
}