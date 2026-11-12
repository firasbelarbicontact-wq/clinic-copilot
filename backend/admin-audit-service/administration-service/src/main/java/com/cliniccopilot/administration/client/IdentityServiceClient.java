package com.cliniccopilot.administration.client;

import com.cliniccopilot.administration.config.AppProperties;
import com.cliniccopilot.administration.config.RestClientFactory;
import com.cliniccopilot.administration.dto.AccountStatus;
import com.cliniccopilot.administration.exception.ExternalServiceException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.Map;
import java.util.UUID;

/**
 * Client REST vers Identity Service (membre M1).
 *
 * TODO (À CONFIRMER avec M1 - porteur d'Identity Service) : le contrat ci-dessous est une HYPOTHÈSE.
 *   - Méthode / chemin : PATCH {identity-url}/api/v1/users/{userId}/status
 *   - Corps            : {"status": "ACTIVE" | "DISABLED"}
 *   - Authentification : en-tête X-Internal-Api-Key (clé partagée)
 *   - Réponse attendue : 2xx (corps ignoré) ; 404 si l'utilisateur n'existe pas
 *   - Y a-t-il un chemin dédié "interne" (ex: /internal/...) ? Valeurs d'enum exactes ?
 */
@Component
public class IdentityServiceClient {

    private static final String SERVICE = "identity-service";
    private final RestClient client;

    public IdentityServiceClient(RestClientFactory factory, AppProperties props) {
        this.client = factory.create(props.clients().identity().baseUrl());
    }

    public void updateUserStatus(UUID userId, AccountStatus status) {
        try {
            client.patch()
                    .uri("/api/v1/users/{id}/status", userId) // TODO: confirmer le chemin avec M1
                    .body(Map.of("status", status.name()))     // TODO: confirmer le corps avec M1
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException e) {
            throw new ExternalServiceException(SERVICE, e.getStatusCode().value(), e.getMessage(), e);
        } catch (RestClientException e) {
            throw new ExternalServiceException(SERVICE, 0, e.getMessage(), e);
        }
    }
}
