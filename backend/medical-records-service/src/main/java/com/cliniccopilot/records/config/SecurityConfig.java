package com.cliniccopilot.records.config;

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
        http.csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers("/actuator/health/**").permitAll()
                // Écriture clinique : médecin uniquement
                .requestMatchers(HttpMethod.POST, "/api/v1/consultations", "/api/v1/consultations/*/notes",
                        "/api/v1/medication-plans").hasRole("DOCTOR")
                .requestMatchers(HttpMethod.PATCH, "/api/v1/medication-plans/*/status").hasRole("DOCTOR")
                // Suivi de prise : patient uniquement
                .requestMatchers(HttpMethod.POST, "/api/v1/medication-items/*/adherence").hasRole("PATIENT")
                // Lecture : patient ou médecin. ADMIN : aucun accès clinique (refusé).
                .requestMatchers("/api/v1/**").hasAnyRole("PATIENT", "DOCTOR")
                .anyRequest().denyAll())
            .addFilterBefore(new JwtAuthenticationFilter(props.security().jwtSecret()),
                    UsernamePasswordAuthenticationFilter.class)
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
