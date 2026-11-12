package com.cliniccopilot.audit.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Lets other backend services call POST /api/v1/audit-logs without a
 * user JWT, by sending a shared "X-Internal-Api-Key" header instead.
 * This is a simple shared-secret scheme for a student project; swap for
 * mTLS or short-lived service tokens if the team wants something stronger.
 */
@Component
public class InternalApiKeyFilter extends OncePerRequestFilter {

    private final String expectedKey;

    public InternalApiKeyFilter(@Value("${internal.api-key}") String expectedKey) {
        this.expectedKey = expectedKey;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String providedKey = request.getHeader("X-Internal-Api-Key");

        if (providedKey != null && providedKey.equals(expectedKey)) {
            var authority = new SimpleGrantedAuthority("ROLE_SERVICE");
            var authentication = new UsernamePasswordAuthenticationToken(
                    "internal-service", null, List.of(authority));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }
}
