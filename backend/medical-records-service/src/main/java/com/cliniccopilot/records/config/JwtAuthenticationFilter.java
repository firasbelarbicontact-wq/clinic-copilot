package com.cliniccopilot.records.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/** Valide un JWT HS256. "sub" = UUID de l'utilisateur, "role" = PATIENT, DOCTOR ou ADMIN. */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Set<String> ROLES = Set.of("PATIENT", "DOCTOR", "ADMIN");
    private final SecretKey key;

    public JwtAuthenticationFilter(String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            try {
                Claims claims = Jwts.parser().verifyWith(key).build()
                        .parseSignedClaims(header.substring(7)).getPayload();
                String role = String.valueOf(claims.get("role")).toUpperCase().replaceFirst("^ROLE_", "");
                if (ROLES.contains(role)) {
                    AuthUser user = new AuthUser(UUID.fromString(claims.getSubject()), role);
                    SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                            user, null, List.of(new SimpleGrantedAuthority("ROLE_" + role))));
                }
            } catch (JwtException | IllegalArgumentException e) {
                // token invalide : requête non authentifiée (401)
            }
        }
        chain.doFilter(request, response);
    }
}
