package com.clinic.identity_service.service;

import java.util.List;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;

import com.clinic.identity_service.dto.LoginRequest;
import com.clinic.identity_service.dto.RegisterRequest;
import com.clinic.identity_service.entity.Role;
import com.clinic.identity_service.entity.User;
import com.clinic.identity_service.exception.ExistedByMailException;
import com.clinic.identity_service.repository.UserRepository;

public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    } 

    public User registerUser(RegisterRequest request) throws ExistedByMailException {

        if (userRepository.findByEmail(request.email())) {
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

        return userRepository.save(user);
    }

    public User loginUser(LoginRequest request) {
        Optional<User> user = userRepository.findUserByEmail(request.email());
        if (user.isPresent() && passwordEncoder.matches(request.password(), user.get().getPassword())) {
            return user.get();
        }
        return null;
    }

    public List<User> getAllUsers() {
        return userRepository.findAllUsers();
    }

    public Boolean DeactivateUser(String email) {
        Optional<User> user = userRepository.findUserByEmail(email);
        if (user.isPresent()) {
            User existingUser = user.get();
            existingUser.setIsActive(false);
            userRepository.save(existingUser);
            return true;
        }
        return false;
    }

    public Boolean ActivateUser(String email) {
        Optional<User> user = userRepository.findUserByEmail(email);
        if (user.isPresent()) {
            User existingUser = user.get();
            existingUser.setIsActive(true);
            userRepository.save(existingUser);
            return true;
        }
        return false;
    }

    public Boolean DeleteUser(String email) {
        Optional<User> user = userRepository.findUserByEmail(email);
        if (user.isPresent()) {
            userRepository.delete(user.get());
            return true;
        }
        return false;
    }
}
