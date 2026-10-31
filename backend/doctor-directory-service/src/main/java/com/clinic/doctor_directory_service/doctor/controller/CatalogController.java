package com.clinic.doctor_directory_service.doctor.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.clinic.doctor_directory_service.doctor.dto.LanguageResponse;
import com.clinic.doctor_directory_service.doctor.dto.SpecialtyResponse;
import com.clinic.doctor_directory_service.doctor.service.CatalogService;

@RestController
@RequestMapping("/api")
public class CatalogController {

    private final CatalogService catalogService;

    public CatalogController(CatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping("/specialties")
    public List<SpecialtyResponse> specialties() {
        return catalogService.listSpecialties();
    }

    @GetMapping("/languages")
    public List<LanguageResponse> languages() {
        return catalogService.listLanguages();
    }
}