package com.clinic.identity_service.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

import com.clinic.identity_service.entity.Role;
import com.clinic.identity_service.entity.User;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, UUID> {
    
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRole(Role role);

    List<User> findByIsActive(boolean isActive);

}
