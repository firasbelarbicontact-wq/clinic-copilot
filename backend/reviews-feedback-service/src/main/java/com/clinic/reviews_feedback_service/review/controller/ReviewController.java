package com.clinic.reviews_feedback_service.review.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.clinic.reviews_feedback_service.common.security.CurrentUser;
import com.clinic.reviews_feedback_service.review.dto.CreateReviewRequest;
import com.clinic.reviews_feedback_service.review.dto.ReviewResponse;
import com.clinic.reviews_feedback_service.review.dto.UpdateReviewRequest;
import com.clinic.reviews_feedback_service.review.service.ReviewService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService service;

    public ReviewController(ReviewService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ReviewResponse> create(@Valid @RequestBody CreateReviewRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(CurrentUser.id(), request));
    }

    @GetMapping("/mine")
    public List<ReviewResponse> mine() {
        return service.listMine(CurrentUser.id());
    }

    @PutMapping("/{id}")
    public ReviewResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateReviewRequest request) {
        return service.update(CurrentUser.id(), id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(CurrentUser.id(), id);
        return ResponseEntity.noContent().build();
    }
}