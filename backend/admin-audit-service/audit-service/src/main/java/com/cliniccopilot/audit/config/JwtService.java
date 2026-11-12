package com.cliniccopilot.audit.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

/**
 * Validates JWTs issued by Identity Service.
 *
 * TODO (team decision, M1 + M6): confirm the signing algorithm (HS256 shared
 * secret vs RS256 public/private key pair) and the exact claim name used for
 * the role (here: "role"). This class assumes HS256 + a "role" claim as a
 * reasonable default to unblock development; adjust once Identity Service's
 * token format is finalized.
 */
@Component
public class JwtService {

    private final SecretKey signingKey;

    public JwtService(@Value("${jwt.secret}") String secret) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /** Returns the parsed claims, or null if the token is missing/invalid/expired. */
    public Claims parseClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }
}
