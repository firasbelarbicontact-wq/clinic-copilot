package com.clinic.doctor_directory_service.doctor.service;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

import org.springframework.core.io.FileSystemResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.clinic.doctor_directory_service.common.exception.BusinessRuleException;
import com.clinic.doctor_directory_service.common.exception.ResourceNotFoundException;
import com.clinic.doctor_directory_service.common.security.CurrentUser;
import com.clinic.doctor_directory_service.doctor.dto.DiplomaResponse;
import com.clinic.doctor_directory_service.doctor.entity.Diploma;
import com.clinic.doctor_directory_service.doctor.entity.DiplomaType;
import com.clinic.doctor_directory_service.doctor.entity.Doctor;
import com.clinic.doctor_directory_service.doctor.entity.DoctorStatusHistory;
import com.clinic.doctor_directory_service.doctor.entity.StatusType;
import com.clinic.doctor_directory_service.doctor.entity.VerificationStatus;
import com.clinic.doctor_directory_service.doctor.repository.DiplomaRepository;
import com.clinic.doctor_directory_service.doctor.repository.DoctorRepository;
import com.clinic.doctor_directory_service.doctor.repository.DoctorStatusHistoryRepository;

@Service
public class DiplomaService {

    static final long MAX_SIZE_BYTES = 5L * 1024 * 1024;
    static final int MAX_DIPLOMAS_PER_DOCTOR = 10;

    private final DoctorRepository doctorRepository;
    private final DiplomaRepository diplomaRepository;
    private final DoctorStatusHistoryRepository historyRepository;
    private final DiplomaStorage storage;

    public DiplomaService(DoctorRepository doctorRepository,
                          DiplomaRepository diplomaRepository,
                          DoctorStatusHistoryRepository historyRepository,
                          DiplomaStorage storage) {
        this.doctorRepository = doctorRepository;
        this.diplomaRepository = diplomaRepository;
        this.historyRepository = historyRepository;
        this.storage = storage;
    }

    @Transactional
    public DiplomaResponse upload(MultipartFile file, DiplomaType type, String title,
                                  String institution, Integer yearObtained) {
        Doctor doctor = findMyDoctor();

        if (file == null || file.isEmpty()) {
            throw new BusinessRuleException("Le fichier est vide.");
        }
        if (file.getSize() > MAX_SIZE_BYTES) {
            throw new BusinessRuleException("Fichier trop volumineux (5 Mo maximum).");
        }
        if (diplomaRepository.countByDoctorId(doctor.getId()) >= MAX_DIPLOMAS_PER_DOCTOR) {
            throw new BusinessRuleException("Nombre maximal de justificatifs atteint (" + MAX_DIPLOMAS_PER_DOCTOR + ").");
        }

        byte[] content;
        try {
            content = file.getBytes();
        } catch (IOException e) {
            throw new UncheckedIOException("Lecture du fichier impossible", e);
        }

        DiplomaStorage.StoredFile stored = storage.store(doctor.getId(), content);
        storage.deleteOnRollback(stored.relativePath());

        Diploma diploma = new Diploma(doctor.getId(), type, title.trim(), clean(institution), yearObtained,
                sanitizeFilename(file.getOriginalFilename()), stored.relativePath(),
                stored.contentType(), stored.size(), stored.sha256());

        if (doctor.getVerificationStatus() == VerificationStatus.REJECTED) {
            doctor.setVerificationStatus(VerificationStatus.PENDING);
            historyRepository.save(new DoctorStatusHistory(doctor.getId(), StatusType.VERIFICATION,
                    VerificationStatus.REJECTED.name(), VerificationStatus.PENDING.name(),
                    CurrentUser.id(), "Nouveau justificatif déposé"));
        }
        return toResponse(diplomaRepository.save(diploma));
    }

    @Transactional(readOnly = true)
    public List<DiplomaResponse> listMine() {
        Doctor doctor = findMyDoctor();
        return diplomaRepository.findByDoctorIdOrderByUploadedAtDesc(doctor.getId()).stream()
                .map(DiplomaService::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public DiplomaFile getMyDiplomaFile(UUID id) {
        Doctor doctor = findMyDoctor();
        Diploma diploma = findOwned(id, doctor);
        Path path = storage.resolveExisting(diploma.getStoragePath());
        return new DiplomaFile(new FileSystemResource(path), diploma.getOriginalFilename(),
                diploma.getContentType(), diploma.getSizeBytes());
    }

    @Transactional
    public void deleteMine(UUID id) {
        Doctor doctor = findMyDoctor();
        Diploma diploma = findOwned(id, doctor);
        if (diploma.getStatus() == VerificationStatus.VERIFIED) {
            throw new BusinessRuleException("Un justificatif vérifié ne peut pas être supprimé.");
        }
        diplomaRepository.delete(diploma);
        storage.deleteAfterCommit(diploma.getStoragePath());
    }

    private Doctor findMyDoctor() {
        return doctorRepository.findByUserId(CurrentUser.id())
                .orElseThrow(() -> new ResourceNotFoundException("Aucun profil médecin n'existe pour ce compte."));
    }

    /** Un justificatif d'un autre médecin répond 404 : on ne révèle pas son existence. */
    private Diploma findOwned(UUID id, Doctor doctor) {
        return diplomaRepository.findByIdAndDoctorId(id, doctor.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Justificatif introuvable."));
    }

    static DiplomaResponse toResponse(Diploma d) {
        return new DiplomaResponse(d.getId(), d.getType(), d.getTitle(), d.getInstitution(), d.getYearObtained(),
                d.getOriginalFilename(), d.getContentType(), d.getSizeBytes(), d.getStatus(),
                d.getRejectionReason(), d.getUploadedAt(), d.getReviewedAt());
    }

    static String sanitizeFilename(String raw) {
        if (raw == null) {
            return "document";
        }
        String name = raw.substring(Math.max(raw.lastIndexOf('/'), raw.lastIndexOf('\\')) + 1);
        name = name.replaceAll("[\\p{Cntrl}:*?\"<>|]", "_").trim();
        if (name.isEmpty()) {
            name = "document";
        }
        return name.length() > 255 ? name.substring(0, 255) : name;
    }

    private static String clean(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}