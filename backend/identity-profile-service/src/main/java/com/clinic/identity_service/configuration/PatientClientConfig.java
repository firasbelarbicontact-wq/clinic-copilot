package com.clinic.identity_service.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class PatientClientConfig {
    
    @Bean
    public RestClient PatientRestClient(RestClient.Builder builder) {
        return builder
                .baseUrl("http://localhost:8090")
                .build();

    }
}

