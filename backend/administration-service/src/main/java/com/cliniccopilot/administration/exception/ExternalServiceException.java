package com.cliniccopilot.administration.exception;

/** Échec d'un appel vers un autre microservice. */
public class ExternalServiceException extends RuntimeException {
    private final String service;
    private final int upstreamStatus; // 0 = pas de réponse (timeout / réseau)

    public ExternalServiceException(String service, int upstreamStatus, String message, Throwable cause) {
        super(message, cause);
        this.service = service;
        this.upstreamStatus = upstreamStatus;
    }
    public String getService() { return service; }
    public int getUpstreamStatus() { return upstreamStatus; }
}
