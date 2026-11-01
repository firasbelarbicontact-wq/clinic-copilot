package com.clinic.identity_service.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class PatientClientConfig {

    @Value("${patient.service.url:http://localhost:8090}")
    private String patientServiceUrl;

    @Bean
    public RestClient patientRestClient() {
        return RestClient.builder()
                .baseUrl(patientServiceUrl)
                .build();
    }
}
