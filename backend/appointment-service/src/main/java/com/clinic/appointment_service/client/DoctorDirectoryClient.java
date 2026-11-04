package com.clinic.appointment_service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Client Feign vers le service doctor-directory (M2).
 * Verifie l existence et la validation d un medecin.
 */
@FeignClient(name = "doctor-directory-service", url = "${services.doctor-directory.url}")
public interface DoctorDirectoryClient {

    @GetMapping("/api/doctors/{id}")
    Object getDoctorById(@PathVariable("id") Long id);

    @GetMapping("/api/doctors/{id}/validated")
    Boolean isDoctorValidated(@PathVariable("id") Long id);
}