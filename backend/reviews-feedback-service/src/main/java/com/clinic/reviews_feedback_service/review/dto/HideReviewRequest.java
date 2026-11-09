package com.clinic.reviews_feedback_service.review.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record HideReviewRequest(@NotBlank @Size(max = 300) String reason) {
}