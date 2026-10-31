package com.clinic.doctor_directory_service.doctor.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.clinic.doctor_directory_service.doctor.entity.Language;

public interface LanguageRepository extends JpaRepository<Language, String> {
}