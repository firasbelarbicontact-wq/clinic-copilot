package com.cliniccopilot.records.service;

import com.cliniccopilot.records.client.AuditClient;
import com.cliniccopilot.records.config.AuthUser;
import com.cliniccopilot.records.dto.RecordsDto.NoteRequest;
import com.cliniccopilot.records.dto.RecordsDto.NoteResponse;
import com.cliniccopilot.records.entity.ClinicalNote;
import com.cliniccopilot.records.entity.Consultation;
import com.cliniccopilot.records.exception.ForbiddenException;
import com.cliniccopilot.records.repository.ClinicalNoteRepository;
import com.cliniccopilot.records.repository.ConsultationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConsultationServiceTest {

    @Mock ConsultationRepository consultations;
    @Mock ClinicalNoteRepository notes;
    @Mock AuditClient audit;

    ConsultationService service;

    final UUID cid = UUID.randomUUID();
    final AuthUser doctor = new AuthUser(UUID.randomUUID(), "DOCTOR");
    final AuthUser otherDoctor = new AuthUser(UUID.randomUUID(), "DOCTOR");
    final AuthUser patient = new AuthUser(UUID.randomUUID(), "PATIENT");
    final AuthUser otherPatient = new AuthUser(UUID.randomUUID(), "PATIENT");

    @BeforeEach
    void setUp() {
        service = new ConsultationService(consultations, notes, new AccessControl(audit), audit);
    }

    private void givenConsultation() {
        Consultation c = new Consultation();
        c.id = cid;
        c.patientId = patient.id();
        c.doctorId = doctor.id();
        c.consultedAt = Instant.now();
        when(consultations.findById(cid)).thenReturn(Optional.of(c));
    }

    @Test
    void addNote_byOtherDoctor_isDeniedAndAudited() {
        givenConsultation();

        assertThatThrownBy(() -> service.addNote(otherDoctor, cid, new NoteRequest("secret")))
                .isInstanceOf(ForbiddenException.class);

        verify(audit).log(otherDoctor, "CLINICAL_NOTE_CREATE", "CONSULTATION", cid, "DENIED");
        verify(notes, never()).save(any());
    }

    @Test
    void addNote_byOwnerDoctor_succeedsAndAudits() {
        givenConsultation();
        when(notes.save(any(ClinicalNote.class))).thenAnswer(inv -> {
            ClinicalNote n = inv.getArgument(0);
            n.id = UUID.randomUUID();
            return n;
        });

        NoteResponse r = service.addNote(doctor, cid, new NoteRequest("note"));

        assertThat(r.consultationId()).isEqualTo(cid);
        assertThat(r.authorId()).isEqualTo(doctor.id());
        verify(audit).log(doctor, "CLINICAL_NOTE_CREATED", "CLINICAL_NOTE", r.id(), "SUCCESS");
    }

    @Test
    void listNotes_byOwnPatient_succeedsAndAudits() {
        givenConsultation();
        ClinicalNote n = new ClinicalNote();
        n.id = UUID.randomUUID();
        n.consultationId = cid;
        n.authorId = doctor.id();
        n.content = "note";
        n.createdAt = Instant.now();
        when(notes.findByConsultationIdOrderByCreatedAtAsc(cid)).thenReturn(List.of(n));

        List<NoteResponse> result = service.listNotes(patient, cid);

        assertThat(result).hasSize(1);
        verify(audit).log(patient, "CLINICAL_NOTE_READ", "CONSULTATION", cid, "SUCCESS");
    }

    @Test
    void listNotes_byOtherPatient_isDeniedAndAudited() {
        givenConsultation();

        assertThatThrownBy(() -> service.listNotes(otherPatient, cid)).isInstanceOf(ForbiddenException.class);

        verify(audit).log(otherPatient, "CLINICAL_NOTE_READ", "CONSULTATION", cid, "DENIED");
        verify(notes, never()).findByConsultationIdOrderByCreatedAtAsc(any());
    }
}
