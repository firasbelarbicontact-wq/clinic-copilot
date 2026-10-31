package com.clinic.doctor_directory_service.directory.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.clinic.doctor_directory_service.common.api.PageResponse;
import com.clinic.doctor_directory_service.directory.dto.PublicDoctorDetail;
import com.clinic.doctor_directory_service.directory.dto.PublicDoctorSummary;
import com.clinic.doctor_directory_service.directory.service.DirectoryService;

@RestController
@RequestMapping("/api/directory/doctors")
public class DirectoryController {

    private final DirectoryService directoryService;

    public DirectoryController(DirectoryService directoryService) {
        this.directoryService = directoryService;
    }

    @GetMapping
    public PageResponse<PublicDoctorSummary> search(
            @RequestParam(name = "q", required = false) String q,
            @RequestParam(name = "specialty", required = false) String specialty,
            @RequestParam(name = "language", required = false) String language,
            @RequestParam(name = "city", required = false) String city,
            @RequestParam(name = "lat", required = false) Double lat,
            @RequestParam(name = "lng", required = false) Double lng,
            @RequestParam(name = "radiusKm", required = false) Double radiusKm,
            @RequestParam(name = "sort", required = false) String sort,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        return directoryService.search(q, specialty, language, city, lat, lng, radiusKm, sort, page, size);
    }

    @GetMapping("/{id}")
    public PublicDoctorDetail get(@PathVariable("id") UUID id) {
        return directoryService.get(id);
    }
}