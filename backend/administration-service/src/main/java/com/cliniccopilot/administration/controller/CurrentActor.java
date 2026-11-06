package com.cliniccopilot.administration.controller;

import org.springframework.security.core.Authentication;

import java.util.UUID;

/** Extrait l'identifiant de l'acteur (claim "sub" du JWT) depuis l'authentification. */
final class CurrentActor {
    private CurrentActor() {}

    static String name(Authentication auth) {
        return auth.getName();
    }

    static UUID id(Authentication auth) {
        return UUID.fromString(auth.getName()); // IllegalArgumentException -> 400 si "sub" n'est pas un UUID
    }
}
