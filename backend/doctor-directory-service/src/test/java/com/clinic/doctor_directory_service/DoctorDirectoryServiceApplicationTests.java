package com.clinic.doctor_directory_service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import com.clinic.doctor_directory_service.doctor.entity.Doctor;
import com.clinic.doctor_directory_service.doctor.entity.Language;
import com.clinic.doctor_directory_service.doctor.entity.Specialty;
import com.clinic.doctor_directory_service.doctor.entity.VerificationStatus;
import com.clinic.doctor_directory_service.doctor.repository.DoctorRepository;
import com.clinic.doctor_directory_service.doctor.repository.LanguageRepository;
import com.clinic.doctor_directory_service.doctor.repository.SpecialtyRepository;

import jakarta.persistence.EntityManager;

@SpringBootTest
@Testcontainers
@Transactional
class DoctorDirectoryServiceApplicationTests {

    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16");

    @Autowired DoctorRepository doctorRepository;
    @Autowired SpecialtyRepository specialtyRepository;
    @Autowired LanguageRepository languageRepository;
    @Autowired EntityManager entityManager;

    @Test
    void migrationsSeedTheCatalogs() {
        assertThat(specialtyRepository.count()).isGreaterThanOrEqualTo(10);
        assertThat(specialtyRepository.findByCode("CARDIOLOGY")).isPresent();
        assertThat(languageRepository.findById("fr")).isPresent();
    }

    @Test
    void doctorIsSavedWithSpecialtyAndLanguage() {
        Specialty cardiology = specialtyRepository.findByCode("CARDIOLOGY").orElseThrow();
        Language french = languageRepository.findById("fr").orElseThrow();

        Doctor doctor = newDoctor("user-1", "TN-0001");
        doctor.addSpecialty(cardiology, true);
        doctor.getLanguages().add(french);

        Doctor saved = doctorRepository.saveAndFlush(doctor);
        entityManager.clear();

        Doctor found = doctorRepository.findById(saved.getId()).orElseThrow();
        assertThat(found.getVerificationStatus()).isEqualTo(VerificationStatus.PENDING);
        assertThat(found.getSpecialties()).hasSize(1);
        assertThat(found.getSpecialties().get(0).isPrimarySpecialty()).isTrue();
        assertThat(found.getLanguages()).extracting(Language::getCode).containsExactly("fr");
        assertThat(found.getCreatedAt()).isNotNull();
    }

    @Test
    void duplicateLicenseNumberIsRejected() {
        doctorRepository.saveAndFlush(newDoctor("user-a", "TN-DUP"));

        assertThatThrownBy(() -> doctorRepository.saveAndFlush(newDoctor("user-b", "TN-DUP")))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    private Doctor newDoctor(String userId, String licenseNumber) {
        Doctor doctor = new Doctor();
        doctor.setUserId(userId);
        doctor.setFirstName("Ali");
        doctor.setLastName("Ben Salah");
        doctor.setLicenseNumber(licenseNumber);
        return doctor;
    }
}