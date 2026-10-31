package com.clinic.doctor_directory_service.doctor.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import com.clinic.doctor_directory_service.doctor.entity.Doctor;
import com.clinic.doctor_directory_service.doctor.entity.VerificationStatus;
import com.clinic.doctor_directory_service.doctor.repository.DoctorRepository;

@SpringBootTest
@Testcontainers
@Transactional
class DoctorProfileControllerTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16");

    @Autowired WebApplicationContext context;
    @Autowired DoctorRepository doctorRepository;

    MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void withoutTokenReturns401() throws Exception {
        mockMvc.perform(get("/api/doctors/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void patientRoleReturns403() throws Exception {
        mockMvc.perform(get("/api/doctors/me").with(userWithRole("user-p", "ROLE_PATIENT")))
                .andExpect(status().isForbidden());
    }

    @Test
    void doctorCanCreateProfile() throws Exception {
        mockMvc.perform(post("/api/doctors/me")
                        .with(doctor("user-1"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("Ben Salah", "TN-1", "36.8", "10.18")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.lastName").value("Ben Salah"))
                .andExpect(jsonPath("$.verificationStatus").value("PENDING"))
                .andExpect(jsonPath("$.professionalStatus").value("ACTIVE"))
                .andExpect(jsonPath("$.id").exists());
    }

    @Test
    void creatingTwiceReturns409() throws Exception {
        createProfile("user-1", "TN-1");

        mockMvc.perform(post("/api/doctors/me")
                        .with(doctor("user-1"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("Ben Salah", "TN-2", "null", "null")))
                .andExpect(status().isConflict());
    }

    @Test
    void licenseNumberUsedByAnotherDoctorReturns409() throws Exception {
        createProfile("user-1", "TN-1");

        mockMvc.perform(post("/api/doctors/me")
                        .with(doctor("user-2"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("Trabelsi", "TN-1", "null", "null")))
                .andExpect(status().isConflict());
    }

    @Test
    void getBeforeCreationReturns404() throws Exception {
        mockMvc.perform(get("/api/doctors/me").with(doctor("user-1")))
                .andExpect(status().isNotFound());
    }

    @Test
    void getAfterCreationReturnsProfile() throws Exception {
        createProfile("user-1", "TN-1");

        mockMvc.perform(get("/api/doctors/me").with(doctor("user-1")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.licenseNumber").value("TN-1"))
                .andExpect(jsonPath("$.specialties").isArray());
    }

    @Test
    void updateChangesFieldsAndKeepsVerificationWhenLicenseUnchanged() throws Exception {
        createProfile("user-1", "TN-1");
        markVerified("user-1");

        mockMvc.perform(put("/api/doctors/me")
                        .with(doctor("user-1"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("Nouveau Nom", "TN-1", "null", "null")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lastName").value("Nouveau Nom"))
                .andExpect(jsonPath("$.verificationStatus").value("VERIFIED"));
    }

    @Test
    void changingLicenseNumberResetsVerificationToPending() throws Exception {
        createProfile("user-1", "TN-1");
        markVerified("user-1");

        mockMvc.perform(put("/api/doctors/me")
                        .with(doctor("user-1"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("Ben Salah", "TN-NEW", "null", "null")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.licenseNumber").value("TN-NEW"))
                .andExpect(jsonPath("$.verificationStatus").value("PENDING"));
    }

    @Test
    void invalidBodyReturns400WithFieldErrors() throws Exception {
        mockMvc.perform(post("/api/doctors/me")
                        .with(doctor("user-1"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"firstName\":\"\",\"lastName\":\"X\",\"licenseNumber\":\"L\","
                                + "\"latitude\":120,\"longitude\":10}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.firstName").exists())
                .andExpect(jsonPath("$.errors.latitude").exists());
    }

    @Test
    void latitudeWithoutLongitudeReturns422() throws Exception {
        mockMvc.perform(post("/api/doctors/me")
                        .with(doctor("user-1"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("Ben Salah", "TN-1", "36.8", "null")))
                .andExpect(status().isUnprocessableEntity());
    }

    private void createProfile(String userId, String license) throws Exception {
        mockMvc.perform(post("/api/doctors/me")
                        .with(doctor(userId))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("Ben Salah", license, "null", "null")))
                .andExpect(status().isCreated());
    }

    private void markVerified(String userId) {
        Doctor doctor = doctorRepository.findByUserId(userId).orElseThrow();
        doctor.setVerificationStatus(VerificationStatus.VERIFIED);
        doctorRepository.saveAndFlush(doctor);
    }

    private static RequestPostProcessor doctor(String userId) {
        return userWithRole(userId, "ROLE_DOCTOR");
    }

    private static RequestPostProcessor userWithRole(String userId, String role) {
        return jwt().jwt(token -> token.subject(userId))
                .authorities(new SimpleGrantedAuthority(role));
    }

    private static String body(String lastName, String license, String latitude, String longitude) {
        return """
                {"firstName":"Ali","lastName":"%s","licenseNumber":"%s","city":"Tunis",
                 "latitude":%s,"longitude":%s}
                """.formatted(lastName, license, latitude, longitude);
    }
}