package com.clinic.reviews_feedback_service.common.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

public final class CurrentUser {

    private CurrentUser() {
    }

    public static String id() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof JwtAuthenticationToken jwt && jwt.getToken().getSubject() != null) {
            return jwt.getToken().getSubject();
        }
        throw new IllegalStateException("Aucun utilisateur authentifié.");
    }
}