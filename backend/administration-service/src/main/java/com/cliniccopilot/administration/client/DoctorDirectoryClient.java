package com.cliniccopilot.administration.client;

import com.cliniccopilot.administration.config.AppProperties;
import com.cliniccopilot.administration.config.RestClientFactory;
import com.cliniccopilot.administration.dto.VerificationStatus;
import com.cliniccopilot.administration.exception.ExternalServiceException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Client REST vers Doctor Directory Service (membre M2).
 *
 * TODO (À CONFIRMER avec M2) : le contrat ci-dessous est une HYPOTHÈSE.
 *   - Quel service porte réellement la vérification : Doctor Service ou Directory Service ?
 *     (le document de répartition attribue la "vérification des diplômes" au Doctor Service)
 *   - Méthode / chemin : PATCH {doctor-directory-url}/api/v1/doctors/{doctorId}/verification
 *   - Corps            : {"status": "VERIFIED" | "REJECTED", "reason": "<motif administratif, optionnel>"}
 *   - Authentification : en-tête X-Internal-Api-Key (clé partagée)
 *   - Réponse attendue : 2xx (corps ignoré) ; 404 si le médecin n'existe pas
 */
@Component
public class DoctorDirectoryClient {

    private static final String SERVICE = "doctor-directory-service";
    private final RestClient client;

    public DoctorDirectoryClient(RestClientFactory factory, AppProperties props) {
        this.client = factory.create(props.clients().doctorDirectory().baseUrl());
    }

    public void updateVerification(UUID doctorId, VerificationStatus status, String reason) {
        Map<String, String> body = new HashMap<>();
        body.put("status", status.name());
        if (reason != null && !reason.isBlank()) body.put("reason", reason);
        try {
            client.patch()
                    .uri("/api/v1/doctors/{id}/verification", doctorId) // TODO: confirmer le chemin avec M2
                    .body(body)                                          // TODO: confirmer le corps avec M2
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException e) {
            throw new ExternalServiceException(SERVICE, e.getStatusCode().value(), e.getMessage(), e);
        } catch (RestClientException e) {
            throw new ExternalServiceException(SERVICE, 0, e.getMessage(), e);
        }
    }
}
