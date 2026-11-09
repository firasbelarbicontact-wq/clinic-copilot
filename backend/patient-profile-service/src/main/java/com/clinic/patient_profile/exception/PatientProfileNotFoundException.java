package com.clinic.patient_profile.exception;

public class PatientProfileNotFoundException extends RuntimeException {

    public PatientProfileNotFoundException(String message) {
        super(message);
    }
}