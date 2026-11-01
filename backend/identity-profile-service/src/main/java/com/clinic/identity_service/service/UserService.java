package com.clinic.identity_service.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.clinic.identity_service.dto.UserResponse;
import com.clinic.identity_service.entity.User;
import com.clinic.identity_service.exception.UserNotFoundException;
import com.clinic.identity_service.repository.UserRepository;


@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::mapToUserResponse)
                .toList();
    }

    @Transactional 
    public void deactivateUser(UUID userId) {
        User user = getUserById(userId);
        user.setIsActive(false);
    }

    @Transactional 
    public void activateUser(UUID userId) {
        User user = getUserById(userId);
        user.setIsActive(true);
    }

    @Transactional 
    public void deleteUser(UUID userId)  {
        User user = getUserById(userId);
        userRepository.delete(user);
    }

    private User getUserById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(
                    "User not found with ID: " + userId
                ));
    }

    private UserResponse mapToUserResponse(User user) {
        return new UserResponse(
                user.getUserId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getDateOfBirth(),
                user.getCreatedAt(),
                user.getRole(),
                user.getIsActive()
        );
    }
}
