package com.clinic.doctor_directory_service.doctor.controller;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.clinic.doctor_directory_service.doctor.dto.DiplomaResponse;
import com.clinic.doctor_directory_service.doctor.entity.DiplomaType;
import com.clinic.doctor_directory_service.doctor.service.DiplomaFile;
import com.clinic.doctor_directory_service.doctor.service.DiplomaService;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/doctors/me/diplomas")
public class DiplomaController {

    private final DiplomaService diplomaService;

    public DiplomaController(DiplomaService diplomaService) {
        this.diplomaService = diplomaService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DiplomaResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") DiplomaType type,
            @RequestParam("title") @NotBlank @Size(max = 150) String title,
            @RequestParam(value = "institution", required = false) @Size(max = 150) String institution,
            @RequestParam(value = "yearObtained", required = false) @Min(1950) @Max(2100) Integer yearObtained) {
        DiplomaResponse created = diplomaService.upload(file, type, title, institution, yearObtained);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public List<DiplomaResponse> list() {
        return diplomaService.listMine();
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<Resource> download(@PathVariable UUID id) {
        DiplomaFile file = diplomaService.getMyDiplomaFile(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.contentType()))
                .contentLength(file.size())
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(file.filename(), StandardCharsets.UTF_8)
                                .build().toString())
                .body(file.resource());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        diplomaService.deleteMine(id);
        return ResponseEntity.noContent().build();
    }
}