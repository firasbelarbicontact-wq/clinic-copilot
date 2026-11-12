package com.cliniccopilot.administration.entity;

/** Types de statistiques agrégées. Uniquement des compteurs/indicateurs non cliniques. */
public enum MetricType {
    TOTAL_USERS,
    ACTIVE_USERS,
    NEW_REGISTRATIONS,
    TOTAL_DOCTORS,
    VERIFIED_DOCTORS,
    PENDING_DOCTOR_VERIFICATIONS,
    APPOINTMENTS_BOOKED,
    APPOINTMENTS_CANCELLED
}
