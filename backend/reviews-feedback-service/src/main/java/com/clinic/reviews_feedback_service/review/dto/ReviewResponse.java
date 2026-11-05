package com.clinic.reviews_feedback_service.review.dto;

import java.time.Instant;
import java.util.UUID;

import com.clinic.reviews_feedback_service.review.entity.Review;
import com.clinic.reviews_feedback_service.review.entity.ReviewStatus;

public record ReviewResponse(
        UUID id,
        UUID doctorId,
        int rating,
        String comment,
        String authorName,
        ReviewStatus status,
        Instant createdAt,
        Instant updatedAt) {

    public static ReviewResponse from(Review r) {
        return new ReviewResponse(r.getId(), r.getDoctorId(), r.getRating(), r.getComment(),
                r.getAuthorName(), r.getStatus(), r.getCreatedAt(), r.getUpdatedAt());
    }
}