package com.cliniccopilot.records.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Security security, Audit audit) {
    public record Security(String jwtSecret, String internalApiKey) {}
    public record Audit(String baseUrl, int timeoutMs) {}
}
