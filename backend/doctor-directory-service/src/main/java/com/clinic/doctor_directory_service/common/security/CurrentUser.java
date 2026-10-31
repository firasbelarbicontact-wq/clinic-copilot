package com.clinic.doctor_directory_service.common.security;

import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

/** Donne l'identifiant du compte (claim "sub" du JWT émis par Identity). Jamais lu depuis le corps d'une requête. */
public final class CurrentUser {

    private CurrentUser() {
    }

    public static String id() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof JwtAuthenticationToken jwtAuthentication
                && jwtAuthentication.getToken().getSubject() != null) {
            return jwtAuthentication.getToken().getSubject();
        }
        throw new AuthenticationCredentialsNotFoundException("Aucun utilisateur authentifié");
    }
}