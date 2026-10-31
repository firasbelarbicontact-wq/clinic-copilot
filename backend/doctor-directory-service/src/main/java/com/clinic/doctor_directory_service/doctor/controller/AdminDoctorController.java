package com.clinic.doctor_directory_service.doctor.controller;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.clinic.doctor_directory_service.common.api.PageResponse;
import com.clinic.doctor_directory_service.doctor.dto.AdminDoctorDetail;
import com.clinic.doctor_directory_service.doctor.dto.AdminDoctorSummary;
import com.clinic.doctor_directory_service.doctor.dto.AdminStatusRequest;
import com.clinic.doctor_directory_service.doctor.dto.ReviewDiplomaRequest;
import com.clinic.doctor_directory_service.doctor.entity.ProfessionalStatus;
import com.clinic.doctor_directory_service.doctor.entity.VerificationStatus;
import com.clinic.doctor_directory_service.doctor.service.AdminDoctorService;
import com.clinic.doctor_directory_service.doctor.service.DiplomaFile;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@RestController
@RequestMapping("/api/admin")
public class AdminDoctorController {

    private final AdminDoctorService adminDoctorService;

    public AdminDoctorController(AdminDoctorService adminDoctorService) {
        this.adminDoctorService = adminDoctorService;
    }

    @GetMapping("/doctors")
    public PageResponse<AdminDoctorSummary> list(
            @RequestParam(required = false) VerificationStatus verificationStatus,
            @RequestParam(required = false) ProfessionalStatus professionalStatus,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return adminDoctorService.list(verificationStatus, professionalStatus, page, size);
    }

    @GetMapping("/doctors/{id}")
    public AdminDoctorDetail get(@PathVariable UUID id) {
        return adminDoctorService.get(id);
    }

    @PatchMapping("/doctors/{id}/status")
    public AdminDoctorDetail changeStatus(@PathVariable UUID id, @Valid @RequestBody AdminStatusRequest request) {
        return adminDoctorService.changeStatus(id, request);
    }

    @GetMapping("/diplomas/{id}/file")
    public ResponseEntity<Resource> download(@PathVariable UUID id) {
        DiplomaFile file = adminDoctorService.getDiplomaFile(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.contentType()))
                .contentLength(file.size())
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(file.filename(), StandardCharsets.UTF_8)
                                .build().toString())
                .body(file.resource());
    }

    @PatchMapping("/diplomas/{id}/verification")
    public AdminDoctorDetail review(@PathVariable UUID id, @Valid @RequestBody ReviewDiplomaRequest request) {
        return adminDoctorService.reviewDiploma(id, request);
    }
}