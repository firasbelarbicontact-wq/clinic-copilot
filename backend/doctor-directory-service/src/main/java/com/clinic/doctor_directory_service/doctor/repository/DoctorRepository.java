package com.clinic.doctor_directory_service.doctor.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.clinic.doctor_directory_service.doctor.entity.Doctor;

public interface DoctorRepository extends JpaRepository<Doctor, UUID> {

    Optional<Doctor> findByUserId(String userId);

    boolean existsByUserId(String userId);

    boolean existsByLicenseNumber(String licenseNumber);
}