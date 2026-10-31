package com.clinic.doctor_directory_service.doctor.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.clinic.doctor_directory_service.doctor.entity.Doctor;
import com.clinic.doctor_directory_service.doctor.entity.ProfessionalStatus;
import com.clinic.doctor_directory_service.doctor.entity.VerificationStatus;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface DoctorRepository extends JpaRepository<Doctor, UUID>, JpaSpecificationExecutor<Doctor> {

    Optional<Doctor> findByUserId(String userId);

    boolean existsByUserId(String userId);

    boolean existsByLicenseNumber(String licenseNumber);

    Page<Doctor> findByVerificationStatus(VerificationStatus status, Pageable pageable);

    Page<Doctor> findByProfessionalStatus(ProfessionalStatus status, Pageable pageable);

    Page<Doctor> findByVerificationStatusAndProfessionalStatus(
            VerificationStatus verificationStatus, ProfessionalStatus professionalStatus, Pageable pageable);
}