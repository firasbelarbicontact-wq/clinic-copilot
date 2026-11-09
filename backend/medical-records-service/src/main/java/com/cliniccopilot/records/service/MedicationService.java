package com.cliniccopilot.records.service;

import com.cliniccopilot.records.client.AuditClient;
import com.cliniccopilot.records.config.AuthUser;
import com.cliniccopilot.records.dto.RecordsDto.AdherenceRequest;
import com.cliniccopilot.records.dto.RecordsDto.AdherenceResponse;
import com.cliniccopilot.records.dto.RecordsDto.CreatePlanRequest;
import com.cliniccopilot.records.dto.RecordsDto.ItemRequest;
import com.cliniccopilot.records.dto.RecordsDto.PlanResponse;
import com.cliniccopilot.records.entity.Consultation;
import com.cliniccopilot.records.entity.MedicationAdherenceLog;
import com.cliniccopilot.records.entity.MedicationItem;
import com.cliniccopilot.records.entity.MedicationPlan;
import com.cliniccopilot.records.exception.NotFoundException;
import com.cliniccopilot.records.repository.ConsultationRepository;
import com.cliniccopilot.records.repository.MedicationAdherenceLogRepository;
import com.cliniccopilot.records.repository.MedicationItemRepository;
import com.cliniccopilot.records.repository.MedicationPlanRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class MedicationService {

    private final MedicationPlanRepository plans;
    private final MedicationItemRepository items;
    private final MedicationAdherenceLogRepository logs;
    private final ConsultationRepository consultations;
    private final AccessControl access;
    private final AuditClient audit;

    // TODO (M4/Notification) : publier un événement RabbitMQ quand un plan ou ses horaires changent,
    //   pour que le Notification Service planifie les rappels de prise (US-68).

    public MedicationService(MedicationPlanRepository plans, MedicationItemRepository items,
                             MedicationAdherenceLogRepository logs, ConsultationRepository consultations,
                             AccessControl access, AuditClient audit) {
        this.plans = plans;
        this.items = items;
        this.logs = logs;
        this.consultations = consultations;
        this.access = access;
        this.audit = audit;
    }

    @Transactional
    public PlanResponse createPlan(AuthUser doctor, CreatePlanRequest r) {
        if (r.endDate() != null && r.endDate().isBefore(r.startDate())) {
            throw new IllegalArgumentException("endDate doit être postérieure à startDate");
        }
        if (r.consultationId() != null) {
            Consultation c = consultations.findById(r.consultationId())
                    .orElseThrow(() -> new IllegalArgumentException("Consultation inconnue"));
            if (!c.doctorId.equals(doctor.id()) || !c.patientId.equals(r.patientId())) {
                throw access.deny(doctor, "MEDICATION_PLAN_CREATE", "CONSULTATION", r.consultationId());
            }
        }
        MedicationPlan p = new MedicationPlan();
        p.patientId = r.patientId();
        p.doctorId = doctor.id();
        p.consultationId = r.consultationId();
        p.title = r.title();
        p.startDate = r.startDate();
        p.endDate = r.endDate();
        p.status = MedicationPlan.Status.ACTIVE;
        for (ItemRequest ir : r.items()) {
            MedicationItem i = new MedicationItem();
            i.plan = p;
            i.name = ir.name();
            i.dosage = ir.dosage();
            i.scheduleTimes = ir.scheduleTimes();
            i.instructions = ir.instructions();
            p.items.add(i);
        }
        p = plans.save(p);
        audit.log(doctor, "MEDICATION_PLAN_CREATED", "MEDICATION_PLAN", p.id, "SUCCESS");
        return PlanResponse.from(p);
    }

    @Transactional(readOnly = true)
    public PlanResponse getPlan(AuthUser user, UUID id) {
        MedicationPlan p = findPlan(id);
        access.requireParticipant(user, p.patientId, p.doctorId, "MEDICATION_PLAN_READ", "MEDICATION_PLAN", id);
        audit.log(user, "MEDICATION_PLAN_READ", "MEDICATION_PLAN", id, "SUCCESS");
        return PlanResponse.from(p);
    }

    @Transactional(readOnly = true)
    public List<PlanResponse> listForPatient(AuthUser user, UUID patientId) {
        List<MedicationPlan> list;
        if (user.isPatient()) {
            if (!user.id().equals(patientId)) {
                throw access.deny(user, "MEDICATION_PLAN_LIST", "PATIENT", patientId);
            }
            list = plans.findByPatientIdOrderByCreatedAtDesc(patientId);
        } else {
            list = plans.findByPatientIdAndDoctorIdOrderByCreatedAtDesc(patientId, user.id());
        }
        audit.log(user, "MEDICATION_PLAN_LIST", "PATIENT", patientId, "SUCCESS");
        return list.stream().map(PlanResponse::from).toList();
    }

    @Transactional
    public PlanResponse changeStatus(AuthUser doctor, UUID planId, MedicationPlan.Status status) {
        MedicationPlan p = findPlan(planId);
        if (!p.doctorId.equals(doctor.id())) {
            throw access.deny(doctor, "MEDICATION_PLAN_STATUS_CHANGE", "MEDICATION_PLAN", planId);
        }
        p.status = status;
        p = plans.save(p);
        audit.log(doctor, "MEDICATION_PLAN_STATUS_CHANGED", "MEDICATION_PLAN", planId, "SUCCESS");
        return PlanResponse.from(p);
    }

    @Transactional
    public AdherenceResponse logAdherence(AuthUser patient, UUID itemId, AdherenceRequest r) {
        MedicationItem item = findItem(itemId);
        if (!item.plan.patientId.equals(patient.id())) {
            throw access.deny(patient, "MEDICATION_ADHERENCE_LOG", "MEDICATION_ITEM", itemId);
        }
        MedicationAdherenceLog l = new MedicationAdherenceLog();
        l.itemId = itemId;
        l.scheduledAt = r.scheduledAt();
        l.status = r.status();
        l.takenAt = r.status() == MedicationAdherenceLog.Status.TAKEN
                ? (r.takenAt() != null ? r.takenAt() : Instant.now()) : null;
        l.loggedAt = Instant.now();
        l = logs.save(l);
        audit.log(patient, "MEDICATION_ADHERENCE_LOGGED", "MEDICATION_ITEM", itemId, "SUCCESS");
        return AdherenceResponse.from(l);
    }

    @Transactional(readOnly = true)
    public List<AdherenceResponse> listAdherence(AuthUser user, UUID itemId) {
        MedicationItem item = findItem(itemId);
        access.requireParticipant(user, item.plan.patientId, item.plan.doctorId,
                "MEDICATION_ADHERENCE_READ", "MEDICATION_ITEM", itemId);
        List<AdherenceResponse> result = logs.findByItemIdOrderByScheduledAtDesc(itemId)
                .stream().map(AdherenceResponse::from).toList();
        audit.log(user, "MEDICATION_ADHERENCE_READ", "MEDICATION_ITEM", itemId, "SUCCESS");
        return result;
    }

    private MedicationPlan findPlan(UUID id) {
        return plans.findById(id).orElseThrow(() -> new NotFoundException("Plan introuvable"));
    }

    private MedicationItem findItem(UUID id) {
        return items.findById(id).orElseThrow(() -> new NotFoundException("Médicament introuvable"));
    }
}
