package com.clinic.doctor_directory_service.doctor.service;

import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.FileSystemResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.clinic.doctor_directory_service.common.api.PageResponse;
import com.clinic.doctor_directory_service.common.exception.BusinessRuleException;
import com.clinic.doctor_directory_service.common.exception.ResourceNotFoundException;
import com.clinic.doctor_directory_service.common.security.CurrentUser;
import com.clinic.doctor_directory_service.doctor.dto.AdminDiplomaResponse;
import com.clinic.doctor_directory_service.doctor.dto.AdminDoctorDetail;
import com.clinic.doctor_directory_service.doctor.dto.AdminDoctorSummary;
import com.clinic.doctor_directory_service.doctor.dto.AdminStatusRequest;
import com.clinic.doctor_directory_service.doctor.dto.ReviewDecision;
import com.clinic.doctor_directory_service.doctor.dto.ReviewDiplomaRequest;
import com.clinic.doctor_directory_service.doctor.dto.StatusHistoryResponse;
import com.clinic.doctor_directory_service.doctor.entity.Diploma;
import com.clinic.doctor_directory_service.doctor.entity.Doctor;
import com.clinic.doctor_directory_service.doctor.entity.DoctorStatusHistory;
import com.clinic.doctor_directory_service.doctor.entity.ProfessionalStatus;
import com.clinic.doctor_directory_service.doctor.entity.StatusType;
import com.clinic.doctor_directory_service.doctor.entity.VerificationStatus;
import com.clinic.doctor_directory_service.doctor.mapper.DoctorMapper;
import com.clinic.doctor_directory_service.doctor.repository.DiplomaRepository;
import com.clinic.doctor_directory_service.doctor.repository.DoctorRepository;
import com.clinic.doctor_directory_service.doctor.repository.DoctorStatusHistoryRepository;

@Service
public class AdminDoctorService {

    private static final Logger log = LoggerFactory.getLogger(AdminDoctorService.class);

    private final DoctorRepository doctorRepository;
    private final DiplomaRepository diplomaRepository;
    private final DoctorStatusHistoryRepository historyRepository;
    private final DiplomaStorage storage;

    public AdminDoctorService(DoctorRepository doctorRepository,
                              DiplomaRepository diplomaRepository,
                              DoctorStatusHistoryRepository historyRepository,
                              DiplomaStorage storage) {
        this.doctorRepository = doctorRepository;
        this.diplomaRepository = diplomaRepository;
        this.historyRepository = historyRepository;
        this.storage = storage;
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminDoctorSummary> list(VerificationStatus verification,
                                                 ProfessionalStatus professional, int page, int size) {
        // Les plus anciens d'abord : c'est une file de vérification.
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt", "id"));
        Page<Doctor> result;
        if (verification != null && professional != null) {
            result = doctorRepository.findByVerificationStatusAndProfessionalStatus(verification, professional, pageable);
        } else if (verification != null) {
            result = doctorRepository.findByVerificationStatus(verification, pageable);
        } else if (professional != null) {
            result = doctorRepository.findByProfessionalStatus(professional, pageable);
        } else {
            result = doctorRepository.findAll(pageable);
        }
        return PageResponse.of(result.map(AdminDoctorService::toSummary));
    }

    @Transactional(readOnly = true)
    public AdminDoctorDetail get(UUID doctorId) {
        return toDetail(findDoctor(doctorId));
    }

    @Transactional(readOnly = true)
    public DiplomaFile getDiplomaFile(UUID diplomaId) {
        Diploma diploma = findDiploma(diplomaId);
        Path path = storage.resolveExisting(diploma.getStoragePath());
        log.info("Justificatif {} consulté par l'administrateur {}", diplomaId, CurrentUser.id());
        return new DiplomaFile(new FileSystemResource(path), diploma.getOriginalFilename(),
                diploma.getContentType(), diploma.getSizeBytes());
    }

    @Transactional
    public AdminDoctorDetail reviewDiploma(UUID diplomaId, ReviewDiplomaRequest request) {
        String adminId = CurrentUser.id();
        Diploma diploma = findDiploma(diplomaId);
        Doctor doctor = findDoctor(diploma.getDoctorId());

        if (doctor.getUserId().equals(adminId)) {
            throw new BusinessRuleException("Vous ne pouvez pas vérifier vos propres justificatifs.");
        }

        String reason = clean(request.reason());
        if (request.decision() == ReviewDecision.REJECTED) {
            if (reason == null) {
                throw new BusinessRuleException("Un motif est obligatoire pour refuser un justificatif.");
            }
            diploma.reject(adminId, reason);
        } else {
            diploma.verify(adminId);
        }

        recomputeVerification(doctor, adminId, reason);
        doctorRepository.flush();
        return toDetail(doctor);
    }

    @Transactional
    public AdminDoctorDetail changeStatus(UUID doctorId, AdminStatusRequest request) {
        Doctor doctor = findDoctor(doctorId);
        String reason = clean(request.reason());
        ProfessionalStatus current = doctor.getProfessionalStatus();
        ProfessionalStatus target = request.status();

        if (target == ProfessionalStatus.SUSPENDED && reason == null) {
            throw new BusinessRuleException("Un motif est obligatoire pour suspendre un profil.");
        }
        if (target != current) {
            doctor.setProfessionalStatus(target);
            historyRepository.save(new DoctorStatusHistory(doctor.getId(), StatusType.PROFESSIONAL,
                    current.name(), target.name(), CurrentUser.id(), reason));
        }
        doctorRepository.flush();
        return toDetail(doctor);
    }

    /** Vérifié si au moins un justificatif l'est, sinon en attente s'il en reste un, sinon refusé. */
    private void recomputeVerification(Doctor doctor, String adminId, String reason) {
        List<Diploma> diplomas = diplomaRepository.findByDoctorIdOrderByUploadedAtDesc(doctor.getId());
        boolean anyVerified = diplomas.stream().anyMatch(d -> d.getStatus() == VerificationStatus.VERIFIED);
        boolean anyPending = diplomas.stream().anyMatch(d -> d.getStatus() == VerificationStatus.PENDING);
        VerificationStatus target = anyVerified ? VerificationStatus.VERIFIED
                : anyPending ? VerificationStatus.PENDING
                : VerificationStatus.REJECTED;

        VerificationStatus current = doctor.getVerificationStatus();
        if (target != current) {
            doctor.setVerificationStatus(target);
            historyRepository.save(new DoctorStatusHistory(doctor.getId(), StatusType.VERIFICATION,
                    current.name(), target.name(), adminId, reason));
        }
    }

    private AdminDoctorDetail toDetail(Doctor doctor) {
        List<AdminDiplomaResponse> diplomas = diplomaRepository
                .findByDoctorIdOrderByUploadedAtDesc(doctor.getId()).stream()
                .map(AdminDoctorService::toAdminDiploma)
                .toList();
        List<StatusHistoryResponse> history = historyRepository
                .findByDoctorIdOrderByChangedAtAsc(doctor.getId()).stream()
                .map(h -> new StatusHistoryResponse(h.getStatusType(), h.getOldValue(), h.getNewValue(),
                        h.getChangedBy(), h.getReason(), h.getChangedAt()))
                .toList();
        return new AdminDoctorDetail(doctor.getUserId(), DoctorMapper.toResponse(doctor), diplomas, history);
    }

    private Doctor findDoctor(UUID id) {
        return doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Médecin introuvable."));
    }

    private Diploma findDiploma(UUID id) {
        return diplomaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Justificatif introuvable."));
    }

    private static AdminDoctorSummary toSummary(Doctor d) {
        return new AdminDoctorSummary(d.getId(), d.getFirstName(), d.getLastName(), d.getLicenseNumber(),
                d.getCity(), d.getVerificationStatus(), d.getProfessionalStatus(), d.getCreatedAt(), d.getUpdatedAt());
    }

    private static AdminDiplomaResponse toAdminDiploma(Diploma d) {
        return new AdminDiplomaResponse(d.getId(), d.getType(), d.getTitle(), d.getInstitution(),
                d.getYearObtained(), d.getOriginalFilename(), d.getContentType(), d.getSizeBytes(),
                d.getStatus(), d.getRejectionReason(), d.getReviewedBy(), d.getUploadedAt(), d.getReviewedAt());
    }

    private static String clean(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}