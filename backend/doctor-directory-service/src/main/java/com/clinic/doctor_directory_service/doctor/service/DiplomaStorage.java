package com.clinic.doctor_directory_service.doctor.service;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.clinic.doctor_directory_service.common.exception.BusinessRuleException;
import com.clinic.doctor_directory_service.common.exception.ResourceNotFoundException;

@Component
public class DiplomaStorage {

    private static final Logger log = LoggerFactory.getLogger(DiplomaStorage.class);

    public record StoredFile(String relativePath, String contentType, long size, String sha256) {
    }

    private final Path root;

    public DiplomaStorage(@Value("${app.storage.diplomas-dir}") String directory) {
        this.root = Path.of(directory).toAbsolutePath().normalize();
    }

    public StoredFile store(UUID doctorId, byte[] content) {
        String contentType = detectContentType(content);
        if (contentType == null) {
            throw new BusinessRuleException("Format non accepté : seuls les fichiers PDF, JPEG et PNG sont autorisés.");
        }
        String relativePath = doctorId + "/" + UUID.randomUUID() + extensionOf(contentType);
        Path target = resolve(relativePath);
        try {
            Files.createDirectories(target.getParent());
            Files.write(target, content, StandardOpenOption.CREATE_NEW);
        } catch (IOException e) {
            throw new UncheckedIOException("Écriture du justificatif impossible", e);
        }
        return new StoredFile(relativePath, contentType, content.length, sha256(content));
    }

    public Path resolveExisting(String relativePath) {
        Path path = resolve(relativePath);
        if (!Files.isRegularFile(path)) {
            throw new ResourceNotFoundException("Fichier introuvable.");
        }
        return path;
    }

    /** Supprime le fichier si la transaction en cours est annulée (évite les fichiers orphelins). */
    public void deleteOnRollback(String relativePath) {
        register(relativePath, false);
    }

    /** Supprime le fichier seulement quand la suppression en base est validée. */
    public void deleteAfterCommit(String relativePath) {
        register(relativePath, true);
    }

    private void register(String relativePath, boolean onCommit) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            if (onCommit) {
                deleteQuietly(relativePath);
            }
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                boolean committed = status == STATUS_COMMITTED;
                if (committed == onCommit) {
                    deleteQuietly(relativePath);
                }
            }
        });
    }

    private void deleteQuietly(String relativePath) {
        try {
            Files.deleteIfExists(resolve(relativePath));
        } catch (IOException | RuntimeException e) {
            log.warn("Suppression du fichier impossible : {}", relativePath);
        }
    }

    private Path resolve(String relativePath) {
        Path path = root.resolve(relativePath).normalize();
        if (!path.startsWith(root)) {
            throw new IllegalArgumentException("Chemin de stockage invalide");
        }
        return path;
    }

    static String detectContentType(byte[] c) {
        if (startsWith(c, '%', 'P', 'D', 'F', '-')) {
            return "application/pdf";
        }
        if (startsWith(c, 0xFF, 0xD8, 0xFF)) {
            return "image/jpeg";
        }
        if (startsWith(c, 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A)) {
            return "image/png";
        }
        return null;
    }

    private static boolean startsWith(byte[] content, int... prefix) {
        if (content.length < prefix.length) {
            return false;
        }
        for (int i = 0; i < prefix.length; i++) {
            if ((content[i] & 0xFF) != prefix[i]) {
                return false;
            }
        }
        return true;
    }

    private static String extensionOf(String contentType) {
        return switch (contentType) {
            case "application/pdf" -> ".pdf";
            case "image/jpeg" -> ".jpg";
            default -> ".png";
        };
    }

    private static String sha256(byte[] content) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(content));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}