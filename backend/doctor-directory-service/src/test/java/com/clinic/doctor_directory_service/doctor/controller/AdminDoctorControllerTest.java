package com.clinic.doctor_directory_service.doctor.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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

import com.clinic.doctor_directory_service.doctor.entity.Doctor;
import com.clinic.doctor_directory_service.doctor.entity.ProfessionalStatus;
import com.clinic.doctor_directory_service.doctor.entity.VerificationStatus;
import com.clinic.doctor_directory_service.doctor.repository.DoctorRepository;
import com.clinic.doctor_directory_service.doctor.repository.DoctorStatusHistoryRepository;
import com.jayway.jsonpath.JsonPath;

@SpringBootTest
@Testcontainers
@Transactional
class AdminDoctorControllerTest {

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
    @Autowired DoctorStatusHistoryRepository historyRepository;

    MockMvc mockMvc;

    static final byte[] PDF = "%PDF-1.4 contenu de test".getBytes(StandardCharsets.UTF_8);

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    // ---------- Sécurité ----------

    @Test
    void withoutTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/admin/doctors")).andExpect(status().isUnauthorized());
    }

    @Test
    void doctorRoleReturns403() throws Exception {
        mockMvc.perform(get("/api/admin/doctors").with(doctor("user-1")))
                .andExpect(status().isForbidden());
    }

    @Test
    void doctorRoleCannotReviewOrSuspend() throws Exception {
        createDoctor("user-1", "TN-1");

        mockMvc.perform(patch("/api/admin/doctors/{id}/status", doctorId("user-1"))
                        .with(doctor("user-1"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"SUSPENDED\",\"reason\":\"test\"}"))
                .andExpect(status().isForbidden());
    }

    // ---------- Liste ----------

    @Test
    void adminListsDoctorsFilteredByVerificationStatus() throws Exception {
        createDoctor("user-1", "TN-1");
        createDoctor("user-2", "TN-2");
        setVerification("user-2", VerificationStatus.VERIFIED);

        mockMvc.perform(get("/api/admin/doctors").param("verificationStatus", "PENDING").with(admin("admin-1")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].licenseNumber").value("TN-1"));
    }

    @Test
    void listWithoutFilterReturnsEveryone() throws Exception {
        createDoctor("user-1", "TN-1");
        createDoctor("user-2", "TN-2");

        mockMvc.perform(get("/api/admin/doctors").with(admin("admin-1")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void listCombinesBothFilters() throws Exception {
        createDoctor("user-1", "TN-1");
        createDoctor("user-2", "TN-2");
        Doctor second = doctorRepository.findByUserId("user-2").orElseThrow();
        second.setProfessionalStatus(ProfessionalStatus.SUSPENDED);
        doctorRepository.saveAndFlush(second);

        mockMvc.perform(get("/api/admin/doctors")
                        .param("verificationStatus", "PENDING")
                        .param("professionalStatus", "SUSPENDED")
                        .with(admin("admin-1")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].licenseNumber").value("TN-2"));
    }

    @Test
    void listIsPaginated() throws Exception {
        createDoctor("user-1", "TN-1");
        createDoctor("user-2", "TN-2");
        createDoctor("user-3", "TN-3");

        mockMvc.perform(get("/api/admin/doctors").param("size", "2").param("page", "0").with(admin("admin-1")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(2));

        mockMvc.perform(get("/api/admin/doctors").param("size", "2").param("page", "1").with(admin("admin-1")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    @Test
    void invalidPageSizeReturns400() throws Exception {
        mockMvc.perform(get("/api/admin/doctors").param("size", "0").with(admin("admin-1")))
                .andExpect(status().isBadRequest());
    }

    // ---------- Détail ----------

    @Test
    void detailShowsProfileDiplomasAndHistory() throws Exception {
        createDoctor("user-1", "TN-1");
        String diplomaId = uploadDiploma("user-1", "Doctorat");
        review(diplomaId, "admin-1", "{\"decision\":\"VERIFIED\"}").andExpect(status().isOk());

        mockMvc.perform(get("/api/admin/doctors/{id}", doctorId("user-1")).with(admin("admin-1")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value("user-1"))
                .andExpect(jsonPath("$.profile.licenseNumber").value("TN-1"))
                .andExpect(jsonPath("$.diplomas.length()").value(1))
                .andExpect(jsonPath("$.diplomas[0].reviewedBy").value("admin-1"))
                .andExpect(jsonPath("$.history.length()").value(1))
                .andExpect(jsonPath("$.history[0].newValue").value("VERIFIED"));
    }

    @Test
    void unknownDoctorReturns404() throws Exception {
        mockMvc.perform(get("/api/admin/doctors/{id}", UUID.randomUUID()).with(admin("admin-1")))
                .andExpect(status().isNotFound());
    }

    // ---------- Vérification des justificatifs ----------

    @Test
    void adminVerifiesDiplomaAndDoctorBecomesVerified() throws Exception {
        createDoctor("user-1", "TN-1");
        String diplomaId = uploadDiploma("user-1", "Doctorat");

        review(diplomaId, "admin-1", "{\"decision\":\"VERIFIED\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.verificationStatus").value("VERIFIED"))
                .andExpect(jsonPath("$.diplomas[0].status").value("VERIFIED"))
                .andExpect(jsonPath("$.diplomas[0].reviewedBy").value("admin-1"))
                .andExpect(jsonPath("$.history.length()").value(1))
                .andExpect(jsonPath("$.history[0].statusType").value("VERIFICATION"))
                .andExpect(jsonPath("$.history[0].oldValue").value("PENDING"))
                .andExpect(jsonPath("$.history[0].newValue").value("VERIFIED"))
                .andExpect(jsonPath("$.history[0].changedBy").value("admin-1"));
    }

    @Test
    void rejectionWithoutReasonReturns422() throws Exception {
        createDoctor("user-1", "TN-1");
        String diplomaId = uploadDiploma("user-1", "Doctorat");

        review(diplomaId, "admin-1", "{\"decision\":\"REJECTED\"}")
                .andExpect(status().isUnprocessableEntity());
        review(diplomaId, "admin-1", "{\"decision\":\"REJECTED\",\"reason\":\"   \"}")
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void rejectingTheOnlyDiplomaMarksDoctorRejected() throws Exception {
        createDoctor("user-1", "TN-1");
        String diplomaId = uploadDiploma("user-1", "Doctorat");

        review(diplomaId, "admin-1", "{\"decision\":\"REJECTED\",\"reason\":\"Document illisible\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.verificationStatus").value("REJECTED"))
                .andExpect(jsonPath("$.diplomas[0].status").value("REJECTED"))
                .andExpect(jsonPath("$.diplomas[0].rejectionReason").value("Document illisible"))
                .andExpect(jsonPath("$.history[0].newValue").value("REJECTED"))
                .andExpect(jsonPath("$.history[0].reason").value("Document illisible"));
    }

    @Test
    void rejectingOneDiplomaKeepsPendingWhileAnotherIsWaiting() throws Exception {
        createDoctor("user-1", "TN-1");
        String first = uploadDiploma("user-1", "Premier");
        uploadDiploma("user-1", "Second");

        review(first, "admin-1", "{\"decision\":\"REJECTED\",\"reason\":\"Illisible\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.verificationStatus").value("PENDING"))
                .andExpect(jsonPath("$.history.length()").value(0));
    }

    @Test
    void rejectingOneDiplomaKeepsVerifiedWhenAnotherIsVerified() throws Exception {
        createDoctor("user-1", "TN-1");
        String first = uploadDiploma("user-1", "Premier");
        String second = uploadDiploma("user-1", "Second");

        review(first, "admin-1", "{\"decision\":\"VERIFIED\"}").andExpect(status().isOk());
        review(second, "admin-1", "{\"decision\":\"REJECTED\",\"reason\":\"Hors sujet\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.verificationStatus").value("VERIFIED"))
                .andExpect(jsonPath("$.history.length()").value(1));
    }

    @Test
    void adminCannotReviewOwnDiploma() throws Exception {
        createDoctor("user-1", "TN-1");
        String diplomaId = uploadDiploma("user-1", "Doctorat");

        review(diplomaId, "user-1", "{\"decision\":\"VERIFIED\"}")
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void unknownDiplomaReturns404() throws Exception {
        review(UUID.randomUUID().toString(), "admin-1", "{\"decision\":\"VERIFIED\"}")
                .andExpect(status().isNotFound());
    }

    @Test
    void invalidDecisionReturns400() throws Exception {
        createDoctor("user-1", "TN-1");
        String diplomaId = uploadDiploma("user-1", "Doctorat");

        review(diplomaId, "admin-1", "{\"decision\":\"MAYBE\"}").andExpect(status().isBadRequest());
    }

    @Test
    void changedLicenseNumberCanBeReverifiedByAdmin() throws Exception {
        createDoctor("user-1", "TN-1");
        String diplomaId = uploadDiploma("user-1", "Doctorat");
        review(diplomaId, "admin-1", "{\"decision\":\"VERIFIED\"}").andExpect(status().isOk());

        mockMvc.perform(put("/api/doctors/me")
                        .with(doctor("user-1"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"firstName\":\"Ali\",\"lastName\":\"Ben Salah\",\"licenseNumber\":\"TN-NEW\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verificationStatus").value("PENDING"));

        review(diplomaId, "admin-1", "{\"decision\":\"VERIFIED\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.verificationStatus").value("VERIFIED"))
                .andExpect(jsonPath("$.history.length()").value(3))
                .andExpect(jsonPath("$.history[2].newValue").value("VERIFIED"));
    }

    @Test
    void adminDownloadsDoctorDiploma() throws Exception {
        createDoctor("user-1", "TN-1");
        String diplomaId = uploadDiploma("user-1", "Doctorat");

        mockMvc.perform(get("/api/admin/diplomas/{id}/file", diplomaId).with(admin("admin-1")))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/pdf"))
                .andExpect(content().bytes(PDF));
    }

    // ---------- Suspension ----------

    @Test
    void adminSuspendsDoctorWithReason() throws Exception {
        createDoctor("user-1", "TN-1");

        changeStatus(doctorId("user-1"), "{\"status\":\"SUSPENDED\",\"reason\":\"Plainte en cours\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.professionalStatus").value("SUSPENDED"))
                .andExpect(jsonPath("$.history[0].statusType").value("PROFESSIONAL"))
                .andExpect(jsonPath("$.history[0].changedBy").value("admin-1"))
                .andExpect(jsonPath("$.history[0].reason").value("Plainte en cours"));

        mockMvc.perform(patch("/api/doctors/me/status")
                        .with(doctor("user-1"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ACTIVE\"}"))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void suspensionWithoutReasonReturns422() throws Exception {
        createDoctor("user-1", "TN-1");

        changeStatus(doctorId("user-1"), "{\"status\":\"SUSPENDED\"}")
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void adminReactivatesDoctor() throws Exception {
        createDoctor("user-1", "TN-1");
        String id = doctorId("user-1");
        changeStatus(id, "{\"status\":\"SUSPENDED\",\"reason\":\"Contrôle\"}").andExpect(status().isOk());

        changeStatus(id, "{\"status\":\"ACTIVE\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.professionalStatus").value("ACTIVE"))
                .andExpect(jsonPath("$.history.length()").value(2));
    }

    @Test
    void sameStatusDoesNotCreateHistory() throws Exception {
        createDoctor("user-1", "TN-1");

        changeStatus(doctorId("user-1"), "{\"status\":\"ACTIVE\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.history.length()").value(0));
        assertThat(historyRepository.findByDoctorIdOrderByChangedAtAsc(
                UUID.fromString(doctorId("user-1")))).isEmpty();
    }

    // ---------- Utilitaires ----------

    private void createDoctor(String userId, String license) throws Exception {
        mockMvc.perform(post("/api/doctors/me")
                        .with(doctor(userId))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"firstName\":\"Ali\",\"lastName\":\"Ben Salah\",\"licenseNumber\":\""
                                + license + "\"}"))
                .andExpect(status().isCreated());
    }

    private String uploadDiploma(String userId, String title) throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "diplome.pdf", "application/octet-stream", PDF);
        MvcResult result = mockMvc.perform(multipart("/api/doctors/me/diplomas")
                        .file(file)
                        .param("type", "DIPLOMA")
                        .param("title", title)
                        .with(doctor(userId)))
                .andExpect(status().isCreated())
                .andReturn();
        return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
    }

    private String doctorId(String userId) {
        return doctorRepository.findByUserId(userId).orElseThrow().getId().toString();
    }

    private void setVerification(String userId, VerificationStatus status) {
        Doctor doctor = doctorRepository.findByUserId(userId).orElseThrow();
        doctor.setVerificationStatus(status);
        doctorRepository.saveAndFlush(doctor);
    }

    private ResultActions review(String diplomaId, String adminId, String json) throws Exception {
        return mockMvc.perform(patch("/api/admin/diplomas/{id}/verification", diplomaId)
                .with(admin(adminId))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json));
    }

    private ResultActions changeStatus(String doctorId, String json) throws Exception {
        return mockMvc.perform(patch("/api/admin/doctors/{id}/status", doctorId)
                .with(admin("admin-1"))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json));
    }

    private static RequestPostProcessor doctor(String userId) {
        return jwt().jwt(token -> token.subject(userId))
                .authorities(new SimpleGrantedAuthority("ROLE_DOCTOR"));
    }

    private static RequestPostProcessor admin(String userId) {
        return jwt().jwt(token -> token.subject(userId))
                .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"));
    }

    private static Path createTempDir() {
        try {
            return Files.createTempDirectory("diplomas-admin-test");
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}