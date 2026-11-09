package com.clinic.identity_service.exception;

public class ExistedByMailException extends RuntimeException {
    public ExistedByMailException(String message) {
        super(message);
    }
}