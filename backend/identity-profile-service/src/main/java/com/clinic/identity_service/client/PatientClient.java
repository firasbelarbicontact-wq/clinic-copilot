package com.clinic.identity_service.client;

import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.clinic.identity_service.dto.CreatePatientRequest;

@Component 
public class PatientClient {
    

    private final RestClient restClient;
 
    public PatientClient(RestClient restClient) {
        this.restClient = restClient;
    }

    public void createPatient(CreatePatientRequest request) {
        restClient.post()
                .uri("/api/patients")
                .body(request)
                .retrieve()
                .toBodilessEntity();
    }
}
