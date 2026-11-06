package com.cliniccopilot.administration.client;

import com.cliniccopilot.administration.config.AppProperties;
import com.cliniccopilot.administration.config.RestClientFactory;
import com.cliniccopilot.administration.dto.AuditLogRequest;
import com.cliniccopilot.administration.exception.ExternalServiceException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

/**
 * Client REST vers Audit Service (contrat CONFIRMÉ, service déjà livré) :
 * POST {audit-url}/api/v1/audit-logs avec l'en-tête X-Internal-Api-Key.
 */
@Component
public class AuditServiceClient {

    private static final String SERVICE = "audit-service";
    private final RestClient client;

    public AuditServiceClient(RestClientFactory factory, AppProperties props) {
        this.client = factory.create(props.clients().audit().baseUrl());
    }

    public void log(AuditLogRequest request) {
        try {
            client.post()
                    .uri("/api/v1/audit-logs")
                    .body(request)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException e) {
            throw new ExternalServiceException(SERVICE, e.getStatusCode().value(), e.getMessage(), e);
        } catch (RestClientException e) {
            throw new ExternalServiceException(SERVICE, 0, e.getMessage(), e);
        }
    }
}
