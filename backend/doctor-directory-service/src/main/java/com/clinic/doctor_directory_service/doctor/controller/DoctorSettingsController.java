package com.clinic.doctor_directory_service.doctor.controller;

import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.clinic.doctor_directory_service.doctor.dto.DoctorProfileResponse;
import com.clinic.doctor_directory_service.doctor.dto.UpdateLanguagesRequest;
import com.clinic.doctor_directory_service.doctor.dto.UpdateSpecialtiesRequest;
import com.clinic.doctor_directory_service.doctor.dto.UpdateStatusRequest;
import com.clinic.doctor_directory_service.doctor.service.DoctorService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/doctors/me")
public class DoctorSettingsController {

    private final DoctorService doctorService;

    public DoctorSettingsController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @PutMapping("/specialties")
    public DoctorProfileResponse updateSpecialties(@Valid @RequestBody UpdateSpecialtiesRequest request) {
        return doctorService.updateMySpecialties(request);
    }

    @PutMapping("/languages")
    public DoctorProfileResponse updateLanguages(@Valid @RequestBody UpdateLanguagesRequest request) {
        return doctorService.updateMyLanguages(request);
    }

    @PatchMapping("/status")
    public DoctorProfileResponse updateStatus(@Valid @RequestBody UpdateStatusRequest request) {
        return doctorService.updateMyStatus(request);
    }
}