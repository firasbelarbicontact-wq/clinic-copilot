package com.cliniccopilot.administration.config;

import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;

/**
 * Construit des RestClient avec timeouts, utilisés par les clients inter-services.
 * On utilise le client HTTP du JDK (java.net.http) car HttpURLConnection ne supporte pas la méthode PATCH.
 */
@Component
public class RestClientFactory {

    private final AppProperties props;

    public RestClientFactory(AppProperties props) {
        this.props = props;
    }

    public RestClient create(String baseUrl) {
        int timeout = props.clients().timeoutMs() > 0 ? props.clients().timeoutMs() : 5000;
        HttpClient httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofMillis(timeout))
                .build();
        JdkClientHttpRequestFactory rf = new JdkClientHttpRequestFactory(httpClient);
        rf.setReadTimeout(Duration.ofMillis(timeout));
        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(rf)
                .defaultHeader("X-Internal-Api-Key", props.security().internalApiKey())
                .build();
    }
}