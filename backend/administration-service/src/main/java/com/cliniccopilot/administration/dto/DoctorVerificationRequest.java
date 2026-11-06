package com.cliniccopilot.administration.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** "reason" : motif administratif du refus (ex: diplôme illisible). Jamais de contenu clinique. */
public record DoctorVerificationRequest(@NotNull VerificationStatus status, @Size(max = 500) String reason) {}
