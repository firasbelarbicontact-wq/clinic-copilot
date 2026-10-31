package com.clinic.doctor_directory_service.doctor.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.clinic.doctor_directory_service.doctor.entity.DoctorStatusHistory;

public interface DoctorStatusHistoryRepository extends JpaRepository<DoctorStatusHistory, Long> {

    List<DoctorStatusHistory> findByDoctorIdOrderByChangedAtAsc(UUID doctorId);
}