package com.clinic.reviews_feedback_service.review.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.clinic.reviews_feedback_service.review.entity.Review;
import com.clinic.reviews_feedback_service.review.entity.ReviewStatus;

public interface ReviewRepository extends JpaRepository<Review, UUID> {

    boolean existsByDoctorIdAndPatientId(UUID doctorId, String patientId);

    Optional<Review> findByIdAndPatientId(UUID id, String patientId);

    List<Review> findByPatientIdOrderByCreatedAtDesc(String patientId);

    Page<Review> findByDoctorIdAndStatus(UUID doctorId, ReviewStatus status, Pageable pageable);

    Page<Review> findByStatus(ReviewStatus status, Pageable pageable);

    Page<Review> findAllBy(Pageable pageable);

    @Query("select avg(r.rating) from Review r where r.doctorId = :doctorId and r.status = com.clinic.reviews_feedback_service.review.entity.ReviewStatus.PUBLISHED")
    Double averageRating(@Param("doctorId") UUID doctorId);

    long countByDoctorIdAndStatus(UUID doctorId, ReviewStatus status);
    
    @Query("select r.rating, count(r) from Review r where r.doctorId = :doctorId and r.status = com.clinic.reviews_feedback_service.review.entity.ReviewStatus.PUBLISHED group by r.rating")
    List<Object[]> ratingDistribution(@Param("doctorId") UUID doctorId);
}