package com.clinic.doctor_directory_service.doctor.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "diploma")
public class Diploma {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private UUID doctorId;

    @Enumerated(EnumType.STRING)
    private DiplomaType type;

    private String title;
    private String institution;
    private Integer yearObtained;
    private String originalFilename;
    private String storagePath;
    private String contentType;
    private long sizeBytes;
    private String sha256;

    @Enumerated(EnumType.STRING)
    private VerificationStatus status = VerificationStatus.PENDING;

    private String rejectionReason;
    private String reviewedBy;
    private Instant reviewedAt;
    private Instant uploadedAt;

    protected Diploma() {
    }

    public Diploma(UUID doctorId, DiplomaType type, String title, String institution, Integer yearObtained,
            String originalFilename, String storagePath, String contentType, long sizeBytes, String sha256) {
        this.doctorId = doctorId;
        this.type = type;
        this.title = title;
        this.institution = institution;
        this.yearObtained = yearObtained;
        this.originalFilename = originalFilename;
        this.storagePath = storagePath;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.sha256 = sha256;
        this.uploadedAt = Instant.now();
    }

    public void verify(String reviewerId) {
        this.status = VerificationStatus.VERIFIED;
        this.reviewedBy = reviewerId;
        this.reviewedAt = Instant.now();
        this.rejectionReason = null;
    }

    public void reject(String reviewerId, String reason) {
        this.status = VerificationStatus.REJECTED;
        this.reviewedBy = reviewerId;
        this.reviewedAt = Instant.now();
        this.rejectionReason = reason;
    }

    public UUID getId() { return id; }
    public UUID getDoctorId() { return doctorId; }
    public DiplomaType getType() { return type; }
    public String getTitle() { return title; }
    public String getInstitution() { return institution; }
    public Integer getYearObtained() { return yearObtained; }
    public String getOriginalFilename() { return originalFilename; }
    public String getStoragePath() { return storagePath; }
    public String getContentType() { return contentType; }
    public long getSizeBytes() { return sizeBytes; }
    public String getSha256() { return sha256; }
    public VerificationStatus getStatus() { return status; }
    public String getRejectionReason() { return rejectionReason; }
    public String getReviewedBy() { return reviewedBy; }
    public Instant getReviewedAt() { return reviewedAt; }
    public Instant getUploadedAt() { return uploadedAt; }
}