package com.cliniccopilot.administration.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.io.IOException;
import java.util.Map;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http, AppProperties props, ObjectMapper mapper) throws Exception {
        var jwtFilter = new JwtAuthenticationFilter(props.security().jwtSecret());
        var apiKeyFilter = new InternalApiKeyFilter(props.security().internalApiKey());

        http.csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers("/actuator/health/**", "/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
                // Enregistrement de statistiques : service interne OU admin
                .requestMatchers(HttpMethod.POST, "/api/v1/dashboard/snapshots").hasAnyRole("ADMIN", "INTERNAL_SERVICE")
                // Tout le reste : ADMIN uniquement
                .requestMatchers("/api/v1/**").hasRole("ADMIN")
                .anyRequest().denyAll())
            .addFilterBefore(apiKeyFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling(e -> e
                .authenticationEntryPoint((req, res, ex) -> write(res, mapper, 401, "UNAUTHORIZED", "Authentification requise"))
                .accessDeniedHandler((req, res, ex) -> write(res, mapper, 403, "FORBIDDEN", "Accès refusé")));
        return http.build();
    }

    private void write(HttpServletResponse res, ObjectMapper mapper, int status, String code, String msg) throws IOException {
        res.setStatus(status);
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        mapper.writeValue(res.getOutputStream(), Map.of("status", status, "error", code, "message", msg));
    }
}
