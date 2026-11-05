package com.clinic.reviews_feedback_service.review.dto;

import java.util.UUID;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateReviewRequest(
        @NotNull UUID doctorId,
        @Min(1) @Max(5) int rating,
        @Size(max = 1000) String comment,
        @Size(max = 60) String authorName) {
}