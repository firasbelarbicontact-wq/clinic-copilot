package com.clinic.reviews_feedback_service.review.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.clinic.reviews_feedback_service.review.dto.AdminReviewResponse;
import com.clinic.reviews_feedback_service.review.dto.HideReviewRequest;
import com.clinic.reviews_feedback_service.review.dto.PageResponse;
import com.clinic.reviews_feedback_service.review.entity.ReviewStatus;
import com.clinic.reviews_feedback_service.review.service.AdminReviewService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/reviews")
public class AdminReviewController {

    private final AdminReviewService service;

    public AdminReviewController(AdminReviewService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<AdminReviewResponse> list(
            @RequestParam(required = false) ReviewStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return service.list(status, page, size);
    }

    @PatchMapping("/{id}/hide")
    public AdminReviewResponse hide(@PathVariable UUID id, @Valid @RequestBody HideReviewRequest request) {
        return service.hide(id, request.reason());
    }

    @PatchMapping("/{id}/publish")
    public AdminReviewResponse publish(@PathVariable UUID id) {
        return service.publish(id);
    }
}