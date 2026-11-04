package com.clinic.appointment_service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;

/**
 * Client Feign vers le service identity-profile (M1) - partie auth.
 * Permet de valider un token JWT et recuperer les infos utilisateur.
 */
@FeignClient(name = "identity-service", url = "${services.identity-profile.url}")
public interface IdentityClient {

    @GetMapping("/api/auth/validate")
    Object validateToken(@RequestHeader("Authorization") String authHeader);

    @GetMapping("/api/auth/me")
    Object getCurrentUser(@RequestHeader("Authorization") String authHeader);
}