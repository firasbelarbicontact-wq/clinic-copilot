package com.cliniccopilot.administration.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Propriétés applicatives (préfixe "app"). Tous les secrets viennent de variables d'environnement. */
@ConfigurationProperties(prefix = "app")
public record AppProperties(Security security, Clients clients) {

    public record Security(String jwtSecret, String internalApiKey) {}

    public record Clients(Client identity, Client doctorDirectory, Client audit, int timeoutMs) {}

    public record Client(String baseUrl) {}
}
