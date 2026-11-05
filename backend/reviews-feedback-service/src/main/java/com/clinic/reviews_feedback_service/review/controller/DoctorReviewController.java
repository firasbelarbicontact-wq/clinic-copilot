package com.clinic.reviews_feedback_service.review.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.clinic.reviews_feedback_service.review.dto.PageResponse;
import com.clinic.reviews_feedback_service.review.dto.PublicReviewResponse;
import com.clinic.reviews_feedback_service.review.dto.RatingSummary;
import com.clinic.reviews_feedback_service.review.service.PublicReviewService;

@RestController
@RequestMapping("/api/doctors/{doctorId}")
public class DoctorReviewController {

    private final PublicReviewService service;

    public DoctorReviewController(PublicReviewService service) {
        this.service = service;
    }

    @GetMapping("/reviews")
    public PageResponse<PublicReviewResponse> reviews(
            @PathVariable UUID doctorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return service.list(doctorId, page, size);
    }

    @GetMapping("/rating")
    public RatingSummary rating(@PathVariable UUID doctorId) {
        return service.summary(doctorId);
    }
}