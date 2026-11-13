package com.clinic.notification_service.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;


import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class JwtService {

    public record AuthUser(String id, String role) {}

    private final SecretKey key;

    public JwtService(@Value("${security.jwt.secret}") String secret) {
        byte[] keyBytes = Decoders.BASE64.decode(secret);
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
    }

    public AuthUser parse(String token) {
        Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();

        String id = firstNonBlank(claims.get("userId"), claims.get("id"), claims.getSubject());
        if (id == null) {
            throw new IllegalArgumentException("Identifiant absent du token");
        }

        Object role = claims.get("role");
        if (role == null && claims.get("roles") instanceof List<?> roles && !roles.isEmpty()) {
            role = roles.get(0);
        }
        String cleanRole = role == null ? "USER" : String.valueOf(role).replace("ROLE_", "");
        return new AuthUser(id, cleanRole);
    }

    private static String firstNonBlank(Object... values) {
        for (Object v : values) {
            if (v != null && !String.valueOf(v).isBlank()) {
                return String.valueOf(v);
            }
        }
        return null;
    }
}