package com.cliniccopilot.records.client;

import com.cliniccopilot.records.config.AppProperties;
import com.cliniccopilot.records.config.AuthUser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Client de l'Audit Service (contrat confirmé : POST /api/v1/audit-logs + X-Internal-Api-Key).
 * Best effort : une panne de l'audit ne bloque jamais l'action métier.
 * On n'envoie JAMAIS de contenu clinique : ni metadata, ni texte de note, ni nom de médicament.
 */
@Component
public class AuditClient {

    private static final Logger log = LoggerFactory.getLogger(AuditClient.class);
    private final RestClient client;

    public AuditClient(AppProperties props) {
        int timeout = props.audit().timeoutMs() > 0 ? props.audit().timeoutMs() : 5000;
        HttpClient http = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofMillis(timeout))
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(http);
        factory.setReadTimeout(Duration.ofMillis(timeout));
        this.client = RestClient.builder()
                .baseUrl(props.audit().baseUrl())
                .requestFactory(factory)
                .defaultHeader("X-Internal-Api-Key", props.security().internalApiKey())
                .build();
    }

    public void log(AuthUser user, String action, String resourceType, UUID resourceId, String result) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("actorId", user.id());
        body.put("actorRole", user.role());
        body.put("action", action);
        body.put("resourceType", resourceType);
        if (resourceId != null) body.put("resourceId", resourceId);
        body.put("result", result);
        try {
            client.post().uri("/api/v1/audit-logs").body(body).retrieve().toBodilessEntity();
        } catch (RuntimeException e) {
            log.warn("Audit indisponible (action={}, result={}): {}", action, result, e.getMessage());
        }
    }
}
