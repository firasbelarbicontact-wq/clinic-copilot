package com.cliniccopilot.administration.dto;

import java.time.Instant;
import java.util.UUID;

public record AdminActionResponse(String action, UUID resourceId, String newStatus, Instant performedAt) {}
