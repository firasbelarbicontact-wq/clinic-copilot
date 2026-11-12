package com.clinic.patient_profile.exception;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import jakarta.servlet.http.HttpServletRequest;

// Deliberately no catch-all Exception handler: it would turn Spring's own 405/415/404
// and Spring Security's access errors into 500s.
@RestControllerAdvice
public class GlobalExceptionHandler {

    // 404 - no profile for this user yet
    @ExceptionHandler(PatientProfileNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
            PatientProfileNotFoundException ex, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, ex.getMessage(), request, Map.of());
    }

    // 409 - unique constraint hit when two first-time saves race for the same user.
    // Generic message on purpose: the real cause may contain personal data.
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(
            DataIntegrityViolationException ex, HttpServletRequest request) {
        return build(
            HttpStatus.CONFLICT,
            "The request conflicts with existing data.",
            request,
            Map.of());
    }

    // 400 - @Valid failed: every invalid field with its message
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(error.getField(), error.getDefaultMessage());
        }

        return build(HttpStatus.BAD_REQUEST, "Validation failed", request, fieldErrors);
    }

    // 400 - malformed JSON
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleUnreadableBody(
            HttpMessageNotReadableException ex, HttpServletRequest request) {
        return build(
            HttpStatus.BAD_REQUEST,
            "Malformed request body. Check the JSON syntax.",
            request,
            Map.of());
    }

    // 400 - a path value that is not a valid UUID (e.g. /api/patient-profiles/abc)
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        return build(
            HttpStatus.BAD_REQUEST,
            "Invalid value for parameter '" + ex.getName() + "'.",
            request,
            Map.of());
    }

    private ResponseEntity<ErrorResponse> build(
            HttpStatus status,
            String message,
            HttpServletRequest request,
            Map<String, String> fieldErrors) {

        ErrorResponse body = new ErrorResponse(
            Instant.now(),
            status.value(),
            status.getReasonPhrase(),
            message,
            request.getRequestURI(),
            fieldErrors
        );

        return ResponseEntity.status(status).body(body);
    }
}