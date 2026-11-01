package com.clinic.identity_service.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.clinic.identity_service.dto.LoginRequest;
import com.clinic.identity_service.dto.RegisterRequest;
import com.clinic.identity_service.entity.Role;
import com.clinic.identity_service.entity.User;
import com.clinic.identity_service.exception.AccountDisabledException;
import com.clinic.identity_service.exception.ExistedByMailException;
import com.clinic.identity_service.exception.InvalidCredentialsException;
import com.clinic.identity_service.repository.UserRepository;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User registerUser(RegisterRequest request){

        if (userRepository.existsByEmail(request.email())) {
            throw new ExistedByMailException(
                "User with this email already exists."
            );
        }

        User user = new User();

        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setEmail(request.email());
        user.setRole(Role.PATIENT);
        user.setIsActive(true);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setDateOfBirth(request.dateOfBirth());

        return userRepository.save(user);
    }

    public User loginUser(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password:"));
        
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new AccountDisabledException("Your account is disabled. Please contact the administrator.");
        }

        return user;
    }
}
