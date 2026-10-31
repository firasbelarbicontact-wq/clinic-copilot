package com.clinic.doctor_directory_service.doctor.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import com.clinic.doctor_directory_service.doctor.entity.Diploma;
import com.clinic.doctor_directory_service.doctor.entity.Doctor;
import com.clinic.doctor_directory_service.doctor.entity.VerificationStatus;
import com.clinic.doctor_directory_service.doctor.repository.DiplomaRepository;
import com.clinic.doctor_directory_service.doctor.repository.DoctorRepository;
import com.clinic.doctor_directory_service.doctor.repository.DoctorStatusHistoryRepository;
import com.jayway.jsonpath.JsonPath;

@SpringBootTest
@Testcontainers
@Transactional
class DiplomaControllerTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16");

    static final Path STORAGE_DIR = createTempDir();

    @DynamicPropertySource
    static void storageProperties(DynamicPropertyRegistry registry) {
        registry.add("app.storage.diplomas-dir", STORAGE_DIR::toString);
    }

    @Autowired WebApplicationContext context;
    @Autowired DoctorRepository doctorRepository;
    @Autowired DiplomaRepository diplomaRepository;
    @Autowired DoctorStatusHistoryRepository historyRepository;

    MockMvc mockMvc;

    static final byte[] PDF = "%PDF-1.4 contenu de test".getBytes(StandardCharsets.UTF_8);
    static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0};

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        createDoctor("user-1", "TN-1");
    }

    @Test
    void doctorUploadsPdf() throws Exception {
        upload("user-1", "diplome.pdf", PDF, "Doctorat en médecine")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.contentType").value("application/pdf"))
                .andExpect(jsonPath("$.originalFilename").value("diplome.pdf"))
                .andExpect(jsonPath("$.sizeBytes").value(PDF.length))
                .andExpect(jsonPath("$.storagePath").doesNotExist());
    }

    @Test
    void pngIsAccepted() throws Exception {
        upload("user-1", "scan.png", PNG, "Attestation")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.contentType").value("image/png"));
    }

    @Test
    void realContentIsCheckedNotTheExtension() throws Exception {
        upload("user-1", "faux.pdf", "ceci n'est pas un pdf".getBytes(StandardCharsets.UTF_8), "Faux")
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void tooLargeFileIsRejected() throws Exception {
        byte[] big = new byte[5 * 1024 * 1024 + 1];
        System.arraycopy(PDF, 0, big, 0, PDF.length);
        upload("user-1", "gros.pdf", big, "Trop gros").andExpect(status().isUnprocessableEntity());
    }

    @Test
    void emptyFileIsRejected() throws Exception {
        upload("user-1", "vide.pdf", new byte[0], "Vide").andExpect(status().isUnprocessableEntity());
    }

    @Test
    void blankTitleReturns400() throws Exception {
        upload("user-1", "diplome.pdf", PDF, " ").andExpect(status().isBadRequest());
    }

    @Test
    void pathInFilenameIsStripped() throws Exception {
        upload("user-1", "../../evil.pdf", PDF, "Diplôme")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.originalFilename").value("evil.pdf"));
    }

    @Test
    void listReturnsMyDiplomasNewestFirst() throws Exception {
        upload("user-1", "a.pdf", PDF, "Premier").andExpect(status().isCreated());
        upload("user-1", "b.pdf", PDF, "Second").andExpect(status().isCreated());

        mockMvc.perform(get("/api/doctors/me/diplomas").with(doctor("user-1")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].title").value("Second"));
    }

    @Test
    void ownerCanDownloadTheFile() throws Exception {
        String id = uploadAndGetId("user-1", "diplome.pdf", PDF);

        MvcResult result = mockMvc.perform(get("/api/doctors/me/diplomas/{id}/file", id).with(doctor("user-1")))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/pdf"))
                .andExpect(content().bytes(PDF))
                .andReturn();
        assertThat(result.getResponse().getHeader("Content-Disposition")).contains("attachment");
    }

    @Test
    void anotherDoctorCannotDownloadMyFile() throws Exception {
        String id = uploadAndGetId("user-1", "diplome.pdf", PDF);
        createDoctor("user-2", "TN-2");

        mockMvc.perform(get("/api/doctors/me/diplomas/{id}/file", id).with(doctor("user-2")))
                .andExpect(status().isNotFound());
    }

    @Test
    void pendingDiplomaCanBeDeleted() throws Exception {
        String id = uploadAndGetId("user-1", "diplome.pdf", PDF);

        mockMvc.perform(delete("/api/doctors/me/diplomas/{id}", id).with(doctor("user-1")))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/doctors/me/diplomas").with(doctor("user-1")))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void verifiedDiplomaCannotBeDeleted() throws Exception {
        String id = uploadAndGetId("user-1", "diplome.pdf", PDF);
        Diploma diploma = diplomaRepository.findById(UUID.fromString(id)).orElseThrow();
        diploma.verify("admin-1");
        diplomaRepository.saveAndFlush(diploma);

        mockMvc.perform(delete("/api/doctors/me/diplomas/{id}", id).with(doctor("user-1")))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void rejectedDoctorGoesBackToPendingOnNewUpload() throws Exception {
        Doctor doctor = doctorRepository.findByUserId("user-1").orElseThrow();
        doctor.setVerificationStatus(VerificationStatus.REJECTED);
        doctorRepository.saveAndFlush(doctor);

        upload("user-1", "nouveau.pdf", PDF, "Nouveau justificatif").andExpect(status().isCreated());

        Doctor reloaded = doctorRepository.findByUserId("user-1").orElseThrow();
        assertThat(reloaded.getVerificationStatus()).isEqualTo(VerificationStatus.PENDING);
        assertThat(historyRepository.findByDoctorIdOrderByChangedAtAsc(reloaded.getId())).hasSize(1);
    }

    @Test
    void maximumTenDiplomasPerDoctor() throws Exception {
        for (int i = 0; i < 10; i++) {
            upload("user-1", "d" + i + ".pdf", PDF, "Diplôme " + i).andExpect(status().isCreated());
        }
        upload("user-1", "d11.pdf", PDF, "Onzième").andExpect(status().isUnprocessableEntity());
    }

    @Test
    void patientRoleReturns403() throws Exception {
        mockMvc.perform(get("/api/doctors/me/diplomas")
                        .with(jwt().jwt(token -> token.subject("user-p"))
                                .authorities(new SimpleGrantedAuthority("ROLE_PATIENT"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void withoutTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/doctors/me/diplomas")).andExpect(status().isUnauthorized());
    }

    // ---------- Utilitaires ----------

    private ResultActions upload(String userId, String filename, byte[] bytes, String title) throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", filename, "application/octet-stream", bytes);
        return mockMvc.perform(multipart("/api/doctors/me/diplomas")
                .file(file)
                .param("type", "DIPLOMA")
                .param("title", title)
                .with(doctor(userId)));
    }

    private String uploadAndGetId(String userId, String filename, byte[] bytes) throws Exception {
        MvcResult result = upload(userId, filename, bytes, "Diplôme").andExpect(status().isCreated()).andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
    }

    private void createDoctor(String userId, String license) throws Exception {
        mockMvc.perform(post("/api/doctors/me")
                        .with(doctor(userId))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"firstName\":\"Ali\",\"lastName\":\"Ben Salah\",\"licenseNumber\":\"" + license + "\"}"))
                .andExpect(status().isCreated());
    }

    private static RequestPostProcessor doctor(String userId) {
        return jwt().jwt(token -> token.subject(userId))
                .authorities(new SimpleGrantedAuthority("ROLE_DOCTOR"));
    }

    private static Path createTempDir() {
        try {
            return Files.createTempDirectory("diplomas-test");
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}