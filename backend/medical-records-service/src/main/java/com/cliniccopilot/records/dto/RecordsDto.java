package com.cliniccopilot.records.dto;

import com.cliniccopilot.records.entity.ClinicalNote;
import com.cliniccopilot.records.entity.Consultation;
import com.cliniccopilot.records.entity.MedicationAdherenceLog;
import com.cliniccopilot.records.entity.MedicationItem;
import com.cliniccopilot.records.entity.MedicationPlan;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Tous les objets d'entrée et de sortie de l'API, regroupés dans un seul fichier. */
public final class RecordsDto {

    private RecordsDto() {}

    // ----- Consultations et notes -----
    public record CreateConsultationRequest(@NotNull UUID patientId, UUID appointmentId, @NotNull Instant consultedAt) {}

    public record ConsultationResponse(UUID id, UUID patientId, UUID doctorId, UUID appointmentId,
                                       Instant consultedAt, Instant createdAt) {
        public static ConsultationResponse from(Consultation c) {
            return new ConsultationResponse(c.id, c.patientId, c.doctorId, c.appointmentId, c.consultedAt, c.createdAt);
        }
    }

    public record NoteRequest(@NotBlank @Size(max = 10000) String content) {}

    public record NoteResponse(UUID id, UUID consultationId, UUID authorId, String content, Instant createdAt) {
        public static NoteResponse from(ClinicalNote n) {
            return new NoteResponse(n.id, n.consultationId, n.authorId, n.content, n.createdAt);
        }
    }

    // ----- Plans de médication -----
    public record ItemRequest(
            @NotBlank @Size(max = 150) String name,
            @Size(max = 100) String dosage,
            @NotBlank @Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d(,([01]\\d|2[0-3]):[0-5]\\d)*$",
                    message = "format attendu : HH:mm ou HH:mm,HH:mm") String scheduleTimes,
            @Size(max = 500) String instructions) {}

    public record CreatePlanRequest(
            @NotNull UUID patientId,
            UUID consultationId,
            @NotBlank @Size(max = 150) String title,
            @NotNull LocalDate startDate,
            LocalDate endDate,
            @NotEmpty @Valid List<ItemRequest> items) {}

    public record ItemResponse(UUID id, String name, String dosage, String scheduleTimes, String instructions) {
        public static ItemResponse from(MedicationItem i) {
            return new ItemResponse(i.id, i.name, i.dosage, i.scheduleTimes, i.instructions);
        }
    }

    public record PlanResponse(UUID id, UUID patientId, UUID doctorId, UUID consultationId, String title,
                               LocalDate startDate, LocalDate endDate, MedicationPlan.Status status,
                               List<ItemResponse> items, Instant createdAt) {
        public static PlanResponse from(MedicationPlan p) {
            return new PlanResponse(p.id, p.patientId, p.doctorId, p.consultationId, p.title, p.startDate,
                    p.endDate, p.status, p.items.stream().map(ItemResponse::from).toList(), p.createdAt);
        }
    }

    public record PlanStatusRequest(@NotNull MedicationPlan.Status status) {}

    // ----- Suivi de prise -----
    public record AdherenceRequest(@NotNull Instant scheduledAt, @NotNull MedicationAdherenceLog.Status status,
                                   Instant takenAt) {}

    public record AdherenceResponse(UUID id, UUID itemId, Instant scheduledAt, Instant takenAt,
                                    MedicationAdherenceLog.Status status, Instant loggedAt) {
        public static AdherenceResponse from(MedicationAdherenceLog l) {
            return new AdherenceResponse(l.id, l.itemId, l.scheduledAt, l.takenAt, l.status, l.loggedAt);
        }
    }
}
