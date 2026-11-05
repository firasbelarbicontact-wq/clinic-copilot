package com.clinic.reviews_feedback_service.review.dto;

import java.time.Instant;
import java.util.UUID;

import com.clinic.reviews_feedback_service.review.entity.Review;
import com.clinic.reviews_feedback_service.review.entity.ReviewStatus;

public record AdminReviewResponse(
        UUID id,
        UUID doctorId,
        String patientId,
        int rating,
        String comment,
        String authorName,
        ReviewStatus status,
        String moderationReason,
        Instant createdAt,
        Instant updatedAt) {

    public static AdminReviewResponse from(Review r) {
        return new AdminReviewResponse(r.getId(), r.getDoctorId(), r.getPatientId(), r.getRating(),
                r.getComment(), r.getAuthorName(), r.getStatus(), r.getModerationReason(),
                r.getCreatedAt(), r.getUpdatedAt());
    }
}