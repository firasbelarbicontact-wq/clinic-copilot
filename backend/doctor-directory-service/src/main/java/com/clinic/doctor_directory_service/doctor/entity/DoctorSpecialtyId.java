package com.clinic.doctor_directory_service.doctor.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class DoctorSpecialtyId implements Serializable {

    @Column(name = "doctor_id")
    private UUID doctorId;

    @Column(name = "specialty_id")
    private Long specialtyId;

    @Override
    public boolean equals(Object o) {
        return o instanceof DoctorSpecialtyId other
                && Objects.equals(doctorId, other.doctorId)
                && Objects.equals(specialtyId, other.specialtyId);
    }

    @Override
    public int hashCode() { return Objects.hash(doctorId, specialtyId); }
}