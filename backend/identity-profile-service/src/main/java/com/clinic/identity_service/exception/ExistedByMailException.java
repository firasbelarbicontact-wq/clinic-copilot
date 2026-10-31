package com.clinic.identity_service.exception;

public class ExistedByMailException extends Exception {
    public ExistedByMailException(String message) {
        super(message);
    }
    
}
