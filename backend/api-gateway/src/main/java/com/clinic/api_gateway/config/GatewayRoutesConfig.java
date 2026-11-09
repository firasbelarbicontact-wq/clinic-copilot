package com.clinic.api_gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.web.servlet.function.RequestPredicates;
import org.springframework.web.servlet.function.RouterFunction;
import org.springframework.web.servlet.function.ServerResponse;

import static org.springframework.cloud.gateway.server.mvc.filter.BeforeFilterFunctions.uri;
import static org.springframework.cloud.gateway.server.mvc.handler.GatewayRouterFunctions.route;
import static org.springframework.cloud.gateway.server.mvc.handler.HandlerFunctions.http;

@Configuration
public class GatewayRoutesConfig {

    @Value("${services.identity-url:http://localhost:8081}")
    private String identityUrl;

    @Value("${services.doctor-url:http://localhost:8082}")
    private String doctorUrl;

    @Value("${services.patient-url:http://localhost:8090}")
    private String patientUrl;

    @Value("${services.appointment-url:http://localhost:8084}")
    private String appointmentUrl;

    @Value("${services.reviews-url:http://localhost:8088}")
    private String reviewsUrl;

    /**
     * Order 1: Reviews & feedback routes.
     * Takes precedence over doctor-directory-service routes:
     * - /api/doctors/{doctorId}/reviews
     * - /api/doctors/{doctorId}/rating
     * - /api/admin/reviews/**
     * - /api/reviews/**
     */
    @Bean
    @Order(1)
    public RouterFunction<ServerResponse> reviewsRoutes() {
        return route("reviews-feedback-service")
                .route(RequestPredicates.path("/api/doctors/{doctorId}/reviews")
                        .or(RequestPredicates.path("/api/doctors/{doctorId}/rating"))
                        .or(RequestPredicates.path("/api/admin/reviews"))
                        .or(RequestPredicates.path("/api/admin/reviews/**"))
                        .or(RequestPredicates.path("/api/reviews"))
                        .or(RequestPredicates.path("/api/reviews/**")),
                        http())
                .before(uri(reviewsUrl))
                .build();
    }

    /**
     * Order 2: Identity & auth routes.
     * - /api/auth/**
     * - /api/users/**
     */
    @Bean
    @Order(2)
    public RouterFunction<ServerResponse> identityRoutes() {
        return route("identity-profile-service")
                .route(RequestPredicates.path("/api/auth/**")
                        .or(RequestPredicates.path("/api/users"))
                        .or(RequestPredicates.path("/api/users/**")),
                        http())
                .before(uri(identityUrl))
                .build();
    }

    /**
     * Order 3: Patient profile routes.
     * - /api/patient-profiles/**
     */
    @Bean
    @Order(3)
    public RouterFunction<ServerResponse> patientRoutes() {
        return route("patient-profile-service")
                .route(RequestPredicates.path("/api/patient-profiles")
                        .or(RequestPredicates.path("/api/patient-profiles/**")),
                        http())
                .before(uri(patientUrl))
                .build();
    }

    /**
     * Order 4: Appointment & availability routes.
     * - /api/appointments/**
     * - /api/availability/**
     */
    @Bean
    @Order(4)
    public RouterFunction<ServerResponse> appointmentRoutes() {
        return route("appointment-service")
                .route(RequestPredicates.path("/api/appointments")
                        .or(RequestPredicates.path("/api/appointments/**"))
                        .or(RequestPredicates.path("/api/availability")
                        .or(RequestPredicates.path("/api/availability/**"))),
                        http())
                .before(uri(appointmentUrl))
                .build();
    }

    @Value("${services.admin-audit-url:http://admin-audit-service:8080}")
    private String adminAuditUrl;

    /**
     * Order 5: Admin audit routes.
     * - /api/admin/audit/**
     */
    @Bean
    @Order(5)
    public RouterFunction<ServerResponse> adminAuditRoutes() {
        return route("admin-audit-service")
                .route(RequestPredicates.path("/api/admin/audit")
                        .or(RequestPredicates.path("/api/admin/audit/**")),
                        http())
                .before(uri(adminAuditUrl))
                .build();
    }

    /**
     * Order 6: Doctor directory, catalog, and admin doctor routes.
     * - /api/directory/**
     * - /api/specialties/**
     * - /api/languages/**
     * - /api/doctors/**
     * - /api/admin/**
     */
    @Bean
    @Order(6)
    public RouterFunction<ServerResponse> doctorRoutes() {
        return route("doctor-directory-service")
                .route(RequestPredicates.path("/api/directory")
                        .or(RequestPredicates.path("/api/directory/**"))
                        .or(RequestPredicates.path("/api/specialties"))
                        .or(RequestPredicates.path("/api/specialties/**"))
                        .or(RequestPredicates.path("/api/languages"))
                        .or(RequestPredicates.path("/api/languages/**"))
                        .or(RequestPredicates.path("/api/doctors/**"))
                        .or(RequestPredicates.path("/api/admin/**")),
                        http())
                .before(uri(doctorUrl))
                .build();
    }
}
