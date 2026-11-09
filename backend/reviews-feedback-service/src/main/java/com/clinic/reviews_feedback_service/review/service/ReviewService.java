package com.clinic.reviews_feedback_service.review.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.clinic.reviews_feedback_service.common.exception.ConflictException;
import com.clinic.reviews_feedback_service.common.exception.ResourceNotFoundException;
import com.clinic.reviews_feedback_service.review.dto.CreateReviewRequest;
import com.clinic.reviews_feedback_service.review.dto.ReviewResponse;
import com.clinic.reviews_feedback_service.review.dto.UpdateReviewRequest;
import com.clinic.reviews_feedback_service.review.entity.Review;
import com.clinic.reviews_feedback_service.review.repository.ReviewRepository;

@Service
public class ReviewService {

    private final ReviewRepository repository;

    public ReviewService(ReviewRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public ReviewResponse create(String patientId, CreateReviewRequest request) {
        if (repository.existsByDoctorIdAndPatientId(request.doctorId(), patientId)) {
            throw new ConflictException("Vous avez déjà laissé un avis pour ce médecin.");
        }
        Review review = new Review();
        review.setDoctorId(request.doctorId());
        review.setPatientId(patientId);
        review.setRating(request.rating());
        review.setComment(clean(request.comment()));
        String name = clean(request.authorName());
        review.setAuthorName(name != null ? name : "Patient");
        return ReviewResponse.from(repository.save(review));
    }

    @Transactional
    public ReviewResponse update(String patientId, UUID id, UpdateReviewRequest request) {
        Review review = findMine(patientId, id);
        review.setRating(request.rating());
        review.setComment(clean(request.comment()));
        return ReviewResponse.from(review);
    }

    @Transactional
    public void delete(String patientId, UUID id) {
        repository.delete(findMine(patientId, id));
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> listMine(String patientId) {
        return repository.findByPatientIdOrderByCreatedAtDesc(patientId).stream()
                .map(ReviewResponse::from)
                .toList();
    }

    private Review findMine(String patientId, UUID id) {
        return repository.findByIdAndPatientId(id, patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Avis introuvable."));
    }

    private static String clean(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}