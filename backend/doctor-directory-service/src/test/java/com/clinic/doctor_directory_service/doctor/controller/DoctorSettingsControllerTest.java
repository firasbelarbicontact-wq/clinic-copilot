package com.clinic.doctor_directory_service.doctor.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

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
import com.clinic.doctor_directory_service.doctor.entity.DoctorStatusHistory;
import com.clinic.doctor_directory_service.doctor.entity.ProfessionalStatus;
import com.clinic.doctor_directory_service.doctor.repository.DoctorRepository;
import com.clinic.doctor_directory_service.doctor.repository.DoctorStatusHistoryRepository;

@SpringBootTest
@Testcontainers
@Transactional
class DoctorSettingsControllerTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16");

    @Autowired WebApplicationContext context;
    @Autowired DoctorRepository doctorRepository;
    @Autowired DoctorStatusHistoryRepository historyRepository;

    MockMvc mockMvc;

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        mockMvc.perform(post("/api/doctors/me")
                        .with(doctor("user-1"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"firstName\":\"Ali\",\"lastName\":\"Ben Salah\",\"licenseNumber\":\"TN-1\"}"))
                .andExpect(status().isCreated());
    }

    // ---------- Catalogues publics ----------

    @Test
    void catalogsArePublic() throws Exception {
        mockMvc.perform(get("/api/specialties"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].code").exists());
        mockMvc.perform(get("/api/languages"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.code=='fr')]").exists());
    }

    // ---------- Spécialités ----------

    @Test
    void doctorSetsSpecialtiesWithPrimaryFirst() throws Exception {
        putSpecialties("[\"PEDIATRICS\",\"CARDIOLOGY\"]", "CARDIOLOGY")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.specialties.length()").value(2))
                .andExpect(jsonPath("$.specialties[0].code").value("CARDIOLOGY"))
                .andExpect(jsonPath("$.specialties[0].primary").value(true));
    }

    @Test
    void changingPrimaryAndRemovingSpecialties() throws Exception {
        putSpecialties("[\"CARDIOLOGY\",\"PEDIATRICS\"]", "CARDIOLOGY").andExpect(status().isOk());

        putSpecialties("[\"CARDIOLOGY\",\"PEDIATRICS\"]", "PEDIATRICS")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.specialties[0].code").value("PEDIATRICS"))
                .andExpect(jsonPath("$.specialties[0].primary").value(true));

        putSpecialties("[\"PEDIATRICS\"]", "PEDIATRICS")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.specialties.length()").value(1));
    }

    @Test
    void primarySpecialtyMustBeInTheList() throws Exception {
        putSpecialties("[\"CARDIOLOGY\"]", "PEDIATRICS").andExpect(status().isUnprocessableEntity());
    }

    @Test
    void unknownSpecialtyIsRejected() throws Exception {
        putSpecialties("[\"NOT_A_SPECIALTY\"]", "NOT_A_SPECIALTY").andExpect(status().isUnprocessableEntity());
    }

    @Test
    void emptySpecialtyListIsRejected() throws Exception {
        putSpecialties("[]", "CARDIOLOGY").andExpect(status().isBadRequest());
    }

    // ---------- Langues ----------

    @Test
    void doctorReplacesLanguages() throws Exception {
        putLanguages("[\"fr\",\"ar\"]")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.languages.length()").value(2));

        putLanguages("[\"en\"]")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.languages.length()").value(1))
                .andExpect(jsonPath("$.languages[0].code").value("en"));
    }

    @Test
    void unknownLanguageIsRejected() throws Exception {
        putLanguages("[\"xx\"]").andExpect(status().isUnprocessableEntity());
    }

    // ---------- Statut ----------

    @Test
    void doctorCanGoOnLeaveAndHistoryIsRecorded() throws Exception {
        patchStatus("ON_LEAVE")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.professionalStatus").value("ON_LEAVE"));

        Doctor doctor = doctorRepository.findByUserId("user-1").orElseThrow();
        List<DoctorStatusHistory> history = historyRepository.findByDoctorIdOrderByChangedAtAsc(doctor.getId());
        assertThat(history).hasSize(1);
        assertThat(history.get(0).getOldValue()).isEqualTo("ACTIVE");
        assertThat(history.get(0).getNewValue()).isEqualTo("ON_LEAVE");
        assertThat(history.get(0).getChangedBy()).isEqualTo("user-1");
    }

    @Test
    void sameStatusDoesNotCreateHistory() throws Exception {
        patchStatus("ACTIVE").andExpect(status().isOk());

        Doctor doctor = doctorRepository.findByUserId("user-1").orElseThrow();
        assertThat(historyRepository.findByDoctorIdOrderByChangedAtAsc(doctor.getId())).isEmpty();
    }

    @Test
    void doctorCannotSuspendHimself() throws Exception {
        patchStatus("SUSPENDED").andExpect(status().isUnprocessableEntity());
    }

    @Test
    void suspendedDoctorCannotChangeStatus() throws Exception {
        Doctor doctor = doctorRepository.findByUserId("user-1").orElseThrow();
        doctor.setProfessionalStatus(ProfessionalStatus.SUSPENDED);
        doctorRepository.saveAndFlush(doctor);

        patchStatus("ACTIVE").andExpect(status().isUnprocessableEntity());
    }

    @Test
    void invalidStatusValueReturns400() throws Exception {
        patchStatus("FOO").andExpect(status().isBadRequest());
    }

    // ---------- Sécurité ----------

    @Test
    void patientCannotUpdateSpecialties() throws Exception {
        mockMvc.perform(put("/api/doctors/me/specialties")
                        .with(jwt().jwt(token -> token.subject("user-p"))
                                .authorities(new SimpleGrantedAuthority("ROLE_PATIENT")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"specialtyCodes\":[\"CARDIOLOGY\"],\"primaryCode\":\"CARDIOLOGY\"}"))
                .andExpect(status().isForbidden());
    }

    // ---------- Utilitaires ----------

    private org.springframework.test.web.servlet.ResultActions putSpecialties(String codes, String primary)
            throws Exception {
        return mockMvc.perform(put("/api/doctors/me/specialties")
                .with(doctor("user-1"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"specialtyCodes\":" + codes + ",\"primaryCode\":\"" + primary + "\"}"));
    }

    private org.springframework.test.web.servlet.ResultActions putLanguages(String codes) throws Exception {
        return mockMvc.perform(put("/api/doctors/me/languages")
                .with(doctor("user-1"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"languageCodes\":" + codes + "}"));
    }

    private org.springframework.test.web.servlet.ResultActions patchStatus(String value) throws Exception {
        return mockMvc.perform(patch("/api/doctors/me/status")
                .with(doctor("user-1"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"" + value + "\"}"));
    }

    private static RequestPostProcessor doctor(String userId) {
        return jwt().jwt(token -> token.subject(userId))
                .authorities(new SimpleGrantedAuthority("ROLE_DOCTOR"));
    }
}