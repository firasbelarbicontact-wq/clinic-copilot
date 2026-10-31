package com.clinic.identity_service.repository;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import com.clinic.identity_service.entity.User;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, UUID> {
    
    boolean findByEmail(String email);

    Optional<User> findUserByEmail(String email);

    List<User> findAllUsers();

}
