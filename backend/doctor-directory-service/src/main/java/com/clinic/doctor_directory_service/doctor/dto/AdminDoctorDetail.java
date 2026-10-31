package com.clinic.doctor_directory_service.doctor.dto;

import java.util.List;

public record AdminDoctorDetail(
        String userId,
        DoctorProfileResponse profile,
        List<AdminDiplomaResponse> diplomas,
        List<StatusHistoryResponse> history) {
}