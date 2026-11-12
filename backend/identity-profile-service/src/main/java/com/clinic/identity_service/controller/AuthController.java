package com.clinic.identity_service.controller;

import com.clinic.identity_service.dto.AuthResponse;
import com.clinic.identity_service.dto.LoginRequest;
import com.clinic.identity_service.dto.RegisterRequest;
import com.clinic.identity_service.dto.UserResponse;
import com.clinic.identity_service.entity.User;
import com.clinic.identity_service.security.CustomUserDetailsService;
import com.clinic.identity_service.security.JwtService;
import com.clinic.identity_service.service.AuthService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    public AuthController(AuthService authService, JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {

        User user = authService.loginUser(request);

        String token = jwtService.generateToken(user);

        AuthResponse response = new AuthResponse(
            token,
            user.getEmail(),
            user.getRole().name()
        );

        HttpStatus status = Boolean.TRUE.equals(user.getIsActive())
            ? HttpStatus.OK
            : HttpStatus.FORBIDDEN;

        return ResponseEntity.status(status).body(response);
    }

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        
        User user = authService.registerUser(request);

        UserResponse response = new UserResponse(
            user.getUserId(),
            user.getFirstName(),
            user.getLastName(),
            user.getEmail(),
            user.getDateOfBirth(),
            user.getCreatedAt(),
            user.getRole(),  
            user.getIsActive()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}