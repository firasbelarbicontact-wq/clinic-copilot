package com.clinic.identity_service.security;

import com.clinic.identity_service.entity.User;
import com.clinic.identity_service.repository.UserRepository;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                    new UsernameNotFoundException(
                        "User not found with email: " + email
                    )
                );

        return toUserDetails(user);
    }

    /** Used by the JWT filter: the token's "sub" claim is the account id. */
    public UserDetails loadUserById(UUID userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                    new UsernameNotFoundException(
                        "User not found with id: " + userId
                    )
                );

        return toUserDetails(user);
    }

    // The principal name is always the account id, like the "sub" claim
    // that the other services read.
    private UserDetails toUserDetails(User user) {
        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUserId().toString())
                .password(user.getPassword())
                .roles(user.getRole().name())
                .disabled(!Boolean.TRUE.equals(user.getIsActive()))
                .build();
    }
}