package com.clinic.identity_service.exception;

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

import jakarta.servlet.http.HttpServletRequest;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 400 - a required field is missing
    @ExceptionHandler(MissingFieldException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(
            MissingFieldException ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, ex.getMessage(), request, Map.of());
    }

    // 401 - wrong email/password, or a Google token that failed verification
    @ExceptionHandler({
        InvalidCredentialsException.class,
        InvalidGoogleTokenException.class
    })
    public ResponseEntity<ErrorResponse> handleUnauthorized(
            RuntimeException ex, HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED, ex.getMessage(), request, Map.of());
    }

    // 403 - the account exists but is deactivated
    @ExceptionHandler(AccountDisabledException.class)
    public ResponseEntity<ErrorResponse> handleForbidden(
            AccountDisabledException ex, HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, ex.getMessage(), request, Map.of());
    }

    // 404 - unknown user id
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
            UserNotFoundException ex, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, ex.getMessage(), request, Map.of());
    }

    // 409 - email already registered
    @ExceptionHandler(ExistedByMailException.class)
    public ResponseEntity<ErrorResponse> handleConflict(
            ExistedByMailException ex, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, ex.getMessage(), request, Map.of());
    }

    // 400 - @Valid failed: returns every invalid field with its message
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest request) {

        Map<String, String> fieldErrors = new LinkedHashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(error.getField(), error.getDefaultMessage());
        }

        return build(HttpStatus.BAD_REQUEST, "Validation failed", request, fieldErrors);
    }

    // 400 - malformed JSON, or a value of the wrong type/format (e.g. a bad date)
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleUnreadableBody(
            HttpMessageNotReadableException ex, HttpServletRequest request) {
        return build(
            HttpStatus.BAD_REQUEST,
            "Malformed request body. Check the JSON syntax and field formats (dates use yyyy-MM-dd).",
            request,
            Map.of());
    }

    // 409 - database constraint hit (e.g. two simultaneous registrations with the same email).
    // The message is deliberately generic: the real cause may contain personal data.
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(
            DataIntegrityViolationException ex, HttpServletRequest request) {
        return build(
            HttpStatus.CONFLICT,
            "The request conflicts with existing data.",
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