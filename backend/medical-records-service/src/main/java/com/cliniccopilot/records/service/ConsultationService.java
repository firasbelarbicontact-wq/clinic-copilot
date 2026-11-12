package com.cliniccopilot.records.service;

import com.cliniccopilot.records.client.AuditClient;
import com.cliniccopilot.records.config.AuthUser;
import com.cliniccopilot.records.dto.RecordsDto.ConsultationResponse;
import com.cliniccopilot.records.dto.RecordsDto.CreateConsultationRequest;
import com.cliniccopilot.records.dto.RecordsDto.NoteRequest;
import com.cliniccopilot.records.dto.RecordsDto.NoteResponse;
import com.cliniccopilot.records.entity.ClinicalNote;
import com.cliniccopilot.records.entity.Consultation;
import com.cliniccopilot.records.exception.NotFoundException;
import com.cliniccopilot.records.repository.ClinicalNoteRepository;
import com.cliniccopilot.records.repository.ConsultationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ConsultationService {

    private final ConsultationRepository consultations;
    private final ClinicalNoteRepository notes;
    private final AccessControl access;
    private final AuditClient audit;

    public ConsultationService(ConsultationRepository consultations, ClinicalNoteRepository notes,
                               AccessControl access, AuditClient audit) {
        this.consultations = consultations;
        this.notes = notes;
        this.access = access;
        this.audit = audit;
    }

    @Transactional
    public ConsultationResponse create(AuthUser doctor, CreateConsultationRequest r) {
        Consultation c = new Consultation();
        c.patientId = r.patientId();
        c.doctorId = doctor.id();
        c.appointmentId = r.appointmentId();
        c.consultedAt = r.consultedAt();
        c = consultations.save(c);
        audit.log(doctor, "CONSULTATION_CREATED", "CONSULTATION", c.id, "SUCCESS");
        return ConsultationResponse.from(c);
    }

    @Transactional(readOnly = true)
    public ConsultationResponse get(AuthUser user, UUID id) {
        Consultation c = find(id);
        access.requireParticipant(user, c.patientId, c.doctorId, "CONSULTATION_READ", "CONSULTATION", id);
        audit.log(user, "CONSULTATION_READ", "CONSULTATION", id, "SUCCESS");
        return ConsultationResponse.from(c);
    }

    /** Un patient ne voit que les siennes ; un médecin ne voit que celles qu'il a créées pour ce patient. */
    @Transactional(readOnly = true)
    public List<ConsultationResponse> listForPatient(AuthUser user, UUID patientId) {
        List<Consultation> list;
        if (user.isPatient()) {
            if (!user.id().equals(patientId)) {
                throw access.deny(user, "CONSULTATION_LIST", "PATIENT", patientId);
            }
            list = consultations.findByPatientIdOrderByConsultedAtDesc(patientId);
        } else {
            list = consultations.findByPatientIdAndDoctorIdOrderByConsultedAtDesc(patientId, user.id());
        }
        audit.log(user, "CONSULTATION_LIST", "PATIENT", patientId, "SUCCESS");
        return list.stream().map(ConsultationResponse::from).toList();
    }

    @Transactional
    public NoteResponse addNote(AuthUser doctor, UUID consultationId, NoteRequest r) {
        Consultation c = find(consultationId);
        if (!c.doctorId.equals(doctor.id())) {
            throw access.deny(doctor, "CLINICAL_NOTE_CREATE", "CONSULTATION", consultationId);
        }
        ClinicalNote n = new ClinicalNote();
        n.consultationId = consultationId;
        n.authorId = doctor.id();
        n.content = r.content();
        n = notes.save(n);
        audit.log(doctor, "CLINICAL_NOTE_CREATED", "CLINICAL_NOTE", n.id, "SUCCESS");
        return NoteResponse.from(n);
    }

    @Transactional(readOnly = true)
    public List<NoteResponse> listNotes(AuthUser user, UUID consultationId) {
        Consultation c = find(consultationId);
        access.requireParticipant(user, c.patientId, c.doctorId, "CLINICAL_NOTE_READ", "CONSULTATION", consultationId);
        List<NoteResponse> result = notes.findByConsultationIdOrderByCreatedAtAsc(consultationId)
                .stream().map(NoteResponse::from).toList();
        audit.log(user, "CLINICAL_NOTE_READ", "CONSULTATION", consultationId, "SUCCESS");
        return result;
    }

    private Consultation find(UUID id) {
        return consultations.findById(id).orElseThrow(() -> new NotFoundException("Consultation introuvable"));
    }
}
