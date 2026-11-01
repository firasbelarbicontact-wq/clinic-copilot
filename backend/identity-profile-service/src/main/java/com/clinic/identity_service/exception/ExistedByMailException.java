package com.clinic.identity_service.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class ExistedByMailException extends RuntimeException {
    public ExistedByMailException(String message) {
        super(message);
    }    
}
