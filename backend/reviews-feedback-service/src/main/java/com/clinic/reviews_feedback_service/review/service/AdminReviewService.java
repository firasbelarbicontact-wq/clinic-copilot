package com.clinic.reviews_feedback_service.review.service;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.clinic.reviews_feedback_service.common.exception.ResourceNotFoundException;
import com.clinic.reviews_feedback_service.review.dto.AdminReviewResponse;
import com.clinic.reviews_feedback_service.review.dto.PageResponse;
import com.clinic.reviews_feedback_service.review.entity.Review;
import com.clinic.reviews_feedback_service.review.entity.ReviewStatus;
import com.clinic.reviews_feedback_service.review.repository.ReviewRepository;

@Service
public class AdminReviewService {

    private final ReviewRepository repository;

    public AdminReviewService(ReviewRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminReviewResponse> list(ReviewStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Review> result = status == null
                ? repository.findAllBy(pageable)
                : repository.findByStatus(status, pageable);
        return PageResponse.of(result.map(AdminReviewResponse::from));
    }

    @Transactional
    public AdminReviewResponse hide(UUID id, String reason) {
        Review review = find(id);
        review.setStatus(ReviewStatus.HIDDEN);
        review.setModerationReason(reason.trim());
        return AdminReviewResponse.from(review);
    }

    @Transactional
    public AdminReviewResponse publish(UUID id) {
        Review review = find(id);
        review.setStatus(ReviewStatus.PUBLISHED);
        review.setModerationReason(null);
        return AdminReviewResponse.from(review);
    }

    private Review find(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Avis introuvable."));
    }
}