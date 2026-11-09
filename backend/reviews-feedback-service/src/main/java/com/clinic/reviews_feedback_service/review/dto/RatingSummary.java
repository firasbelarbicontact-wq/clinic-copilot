package com.clinic.reviews_feedback_service.review.dto;

import java.util.Map;
import java.util.UUID;

public record RatingSummary(
        UUID doctorId,
        double average,
        long count,
        Map<Integer, Long> distribution) {
}