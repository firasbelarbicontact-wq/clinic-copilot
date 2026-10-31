package com.clinic.doctor_directory_service.doctor.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

@Entity
@Table(name = "doctor_specialty")
public class DoctorSpecialty {

    @EmbeddedId
    private DoctorSpecialtyId id = new DoctorSpecialtyId();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("doctorId")
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("specialtyId")
    @JoinColumn(name = "specialty_id")
    private Specialty specialty;

    @Column(name = "is_primary", nullable = false)
    private boolean primarySpecialty;

    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }
    public Specialty getSpecialty() { return specialty; }
    public void setSpecialty(Specialty specialty) { this.specialty = specialty; }
    public boolean isPrimarySpecialty() { return primarySpecialty; }
    public void setPrimarySpecialty(boolean primarySpecialty) { this.primarySpecialty = primarySpecialty; }
}