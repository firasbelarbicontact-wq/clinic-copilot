package com.clinic.reviews_feedback_service.review.service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.clinic.reviews_feedback_service.review.dto.PageResponse;
import com.clinic.reviews_feedback_service.review.dto.PublicReviewResponse;
import com.clinic.reviews_feedback_service.review.dto.RatingSummary;
import com.clinic.reviews_feedback_service.review.entity.ReviewStatus;
import com.clinic.reviews_feedback_service.review.repository.ReviewRepository;

@Service
@Transactional(readOnly = true)
public class PublicReviewService {

    private static final int MAX_SIZE = 50;

    private final ReviewRepository repository;

    public PublicReviewService(ReviewRepository repository) {
        this.repository = repository;
    }

    public PageResponse<PublicReviewResponse> list(UUID doctorId, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), MAX_SIZE);
        PageRequest pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        return PageResponse.of(
                repository.findByDoctorIdAndStatus(doctorId, ReviewStatus.PUBLISHED, pageable)
                        .map(PublicReviewResponse::from));
    }

    public RatingSummary summary(UUID doctorId) {
        Map<Integer, Long> distribution = new LinkedHashMap<>();
        for (int star = 5; star >= 1; star--) {
            distribution.put(star, 0L);
        }
        long count = 0;
        for (Object[] row : repository.ratingDistribution(doctorId)) {
            int star = ((Number) row[0]).intValue();
            long n = ((Number) row[1]).longValue();
            distribution.put(star, n);
            count += n;
        }
        Double avg = repository.averageRating(doctorId);
        double average = avg == null ? 0.0 : Math.round(avg * 10.0) / 10.0;
        return new RatingSummary(doctorId, average, count, distribution);
    }
}