package com.clinic.appointment_service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Client Feign vers le service identity-profile (M1) - partie patient.
 * Verifie l existence d un patient.
 */
@FeignClient(name = "patient-profile-service", url = "${services.identity-profile.url}")
public interface PatientProfileClient {

    @GetMapping("/api/patients/{id}")
    Object getPatientById(@PathVariable("id") Long id);
}