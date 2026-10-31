package com.clinic.doctor_directory_service.doctor.service;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.clinic.doctor_directory_service.doctor.dto.LanguageResponse;
import com.clinic.doctor_directory_service.doctor.dto.SpecialtyResponse;
import com.clinic.doctor_directory_service.doctor.repository.LanguageRepository;
import com.clinic.doctor_directory_service.doctor.repository.SpecialtyRepository;

@Service
@Transactional(readOnly = true)
public class CatalogService {

    private final SpecialtyRepository specialtyRepository;
    private final LanguageRepository languageRepository;

    public CatalogService(SpecialtyRepository specialtyRepository, LanguageRepository languageRepository) {
        this.specialtyRepository = specialtyRepository;
        this.languageRepository = languageRepository;
    }

    public List<SpecialtyResponse> listSpecialties() {
        return specialtyRepository.findAll(Sort.by("name")).stream()
                .map(s -> new SpecialtyResponse(s.getCode(), s.getName(), s.getDescription()))
                .toList();
    }

    public List<LanguageResponse> listLanguages() {
        return languageRepository.findAll(Sort.by("name")).stream()
                .map(l -> new LanguageResponse(l.getCode(), l.getName()))
                .toList();
    }
}