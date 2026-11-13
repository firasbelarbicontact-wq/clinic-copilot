package com.clinic.notification_service.repository;

import com.clinic.notification_service.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Page<Notification> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    Page<Notification> findByUserIdAndSeenFalseOrderByCreatedAtDesc(String userId, Pageable pageable);

    long countByUserIdAndSeenFalse(String userId);

    Optional<Notification> findByIdAndUserId(UUID id, String userId);

    @Modifying(clearAutomatically = true)
    @Query("update Notification n set n.seen = true where n.userId = :userId and n.seen = false")
    int markAllSeen(@Param("userId") String userId);
}