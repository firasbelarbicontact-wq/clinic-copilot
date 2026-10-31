package com.clinic.doctor_directory_service.doctor.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.clinic.doctor_directory_service.doctor.entity.Diploma;

public interface DiplomaRepository extends JpaRepository<Diploma, UUID> {

    List<Diploma> findByDoctorIdOrderByUploadedAtDesc(UUID doctorId);

    Optional<Diploma> findByIdAndDoctorId(UUID id, UUID doctorId);

    long countByDoctorId(UUID doctorId);
}