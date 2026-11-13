package com.clinic.notification_service.dto;

import com.clinic.notification_service.entity.Notification;
import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        String type,
        String title,
        String message,
        String referenceId,
        boolean read,
        Instant createdAt) {

    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(n.getId(), n.getType(), n.getTitle(), n.getMessage(),
                n.getReferenceId(), n.isSeen(), n.getCreatedAt());
    }
}