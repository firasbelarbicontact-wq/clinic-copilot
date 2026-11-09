package com.clinic.reviews_feedback_service.review.dto;

import java.time.Instant;
import java.util.UUID;

import com.clinic.reviews_feedback_service.review.entity.Review;

public record PublicReviewResponse(
        UUID id,
        int rating,
        String comment,
        String authorName,
        Instant createdAt) {

    public static PublicReviewResponse from(Review r) {
        return new PublicReviewResponse(r.getId(), r.getRating(), r.getComment(),
                r.getAuthorName(), r.getCreatedAt());
    }
}