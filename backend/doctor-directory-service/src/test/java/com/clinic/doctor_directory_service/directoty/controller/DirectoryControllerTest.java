package com.clinic.doctor_directory_service.directory.controller;

import static org.hamcrest.Matchers.closeTo;
import static org.hamcrest.Matchers.contains;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
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
import com.clinic.doctor_directory_service.doctor.repository.LanguageRepository;
import com.clinic.doctor_directory_service.doctor.repository.SpecialtyRepository;

@SpringBootTest
@Testcontainers
@Transactional
class DirectoryControllerTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16");

    static final Path STORAGE_DIR = createTempDir();

    @DynamicPropertySource
    static void storageProperties(DynamicPropertyRegistry registry) {
        registry.add("app.storage.diplomas-dir", STORAGE_DIR::toString);
    }

    static final String URL = "/api/directory/doctors";

    // Tunis, Ariana (~7 km), Sousse (~116 km), Sfax (~236 km)
    static final double TUNIS_LAT = 36.8065, TUNIS_LNG = 10.1815;

    @Autowired WebApplicationContext context;
    @Autowired DoctorRepository doctorRepository;
    @Autowired SpecialtyRepository specialtyRepository;
    @Autowired LanguageRepository languageRepository;

    MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    // ---------- Liste ----------

    @Test
    void listIsPublicAndSortedByName() throws Exception {
        seedVisible();

        mockMvc.perform(get(URL))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(5))
                .andExpect(jsonPath("$.content[*].lastName",
                        contains("Abidi", "Ben Salah", "Gharbi", "Trabelsi", "Zouari")))
                .andExpect(jsonPath("$.content[0].distanceKm").isEmpty());
    }

    @Test
    void onlyVerifiedAndActiveDoctorsAreListed() throws Exception {
        seedVisible();
        seedHidden();

        mockMvc.perform(get(URL))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(5));
    }

    @Test
    void publicResponseHidesSensitiveFields() throws Exception {
        seedVisible();

        mockMvc.perform(get(URL))
                .andExpect(jsonPath("$.content[0].licenseNumber").doesNotExist())
                .andExpect(jsonPath("$.content[0].userId").doesNotExist())
                .andExpect(jsonPath("$.content[0].verificationStatus").doesNotExist())
                .andExpect(jsonPath("$.content[0].professionalStatus").doesNotExist());
    }

    @Test
    void filterBySpecialtyIgnoresCase() throws Exception {
        seedVisible();

        mockMvc.perform(get(URL).param("specialty", "cardiology"))
                .andExpect(jsonPath("$.content[*].lastName", contains("Trabelsi", "Zouari")));
    }

    @Test
    void filterByLanguage() throws Exception {
        seedVisible();

        mockMvc.perform(get(URL).param("language", "EN"))
                .andExpect(jsonPath("$.content[*].lastName", contains("Trabelsi")));
    }

    @Test
    void filterByCityIgnoresCase() throws Exception {
        seedVisible();

        mockMvc.perform(get(URL).param("city", "tunis"))
                .andExpect(jsonPath("$.content[*].lastName", contains("Abidi", "Ben Salah")));
    }

    @Test
    void searchByNameIsPartialAndOrderInsensitive() throws Exception {
        seedVisible();

        mockMvc.perform(get(URL).param("q", "salah"))
                .andExpect(jsonPath("$.totalElements").value(1));
        mockMvc.perform(get(URL).param("q", "ali ben"))
                .andExpect(jsonPath("$.content[*].lastName", contains("Ben Salah")));
        mockMvc.perform(get(URL).param("q", "salah ali"))
                .andExpect(jsonPath("$.content[*].lastName", contains("Ben Salah")));
        mockMvc.perform(get(URL).param("q", "ZOUARI"))
                .andExpect(jsonPath("$.content[*].lastName", contains("Zouari")));
    }

    @Test
    void percentSignInSearchIsLiteral() throws Exception {
        seedVisible();

        mockMvc.perform(get(URL).param("q", "%"))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void filtersCanBeCombined() throws Exception {
        seedVisible();

        mockMvc.perform(get(URL).param("specialty", "CARDIOLOGY").param("language", "fr"))
                .andExpect(jsonPath("$.content[*].lastName", contains("Trabelsi", "Zouari")));
        mockMvc.perform(get(URL).param("specialty", "CARDIOLOGY").param("language", "fr").param("city", "Sfax"))
                .andExpect(jsonPath("$.content[*].lastName", contains("Zouari")));
    }

    @Test
    void paginationSplitsResults() throws Exception {
        seedVisible();

        mockMvc.perform(get(URL).param("size", "2").param("page", "1"))
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.content[0].lastName").value("Gharbi"))
                .andExpect(jsonPath("$.totalElements").value(5))
                .andExpect(jsonPath("$.totalPages").value(3));
        mockMvc.perform(get(URL).param("size", "2").param("page", "2"))
                .andExpect(jsonPath("$.content.length()").value(1));
    }

    // ---------- Distance ----------

    @Test
    void positionSortsByDistanceAndPutsDoctorsWithoutCoordinatesLast() throws Exception {
        seedVisible();

        mockMvc.perform(get(URL).param("lat", "" + TUNIS_LAT).param("lng", "" + TUNIS_LNG))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].lastName",
                        contains("Ben Salah", "Trabelsi", "Gharbi", "Zouari", "Abidi")))
                .andExpect(jsonPath("$.content[0].distanceKm", closeTo(0.0, 0.05)))
                .andExpect(jsonPath("$.content[1].distanceKm", closeTo(6.8, 0.05)))
                .andExpect(jsonPath("$.content[2].distanceKm", closeTo(115.6, 0.1)))
                .andExpect(jsonPath("$.content[4].distanceKm").isEmpty());
    }

    @Test
    void radiusExcludesFarDoctorsAndDoctorsWithoutCoordinates() throws Exception {
        seedVisible();

        mockMvc.perform(get(URL).param("lat", "" + TUNIS_LAT).param("lng", "" + TUNIS_LNG)
                        .param("radiusKm", "50"))
                .andExpect(jsonPath("$.content[*].lastName", contains("Ben Salah", "Trabelsi")))
                .andExpect(jsonPath("$.totalElements").value(2));
        mockMvc.perform(get(URL).param("lat", "" + TUNIS_LAT).param("lng", "" + TUNIS_LNG)
                        .param("radiusKm", "150"))
                .andExpect(jsonPath("$.totalElements").value(3));
    }

    @Test
    void sortByNameKeepsDistancesWhenPositionIsGiven() throws Exception {
        seedVisible();

        mockMvc.perform(get(URL).param("lat", "" + TUNIS_LAT).param("lng", "" + TUNIS_LNG)
                        .param("radiusKm", "150").param("sort", "name"))
                .andExpect(jsonPath("$.content[*].lastName", contains("Ben Salah", "Gharbi", "Trabelsi")))
                .andExpect(jsonPath("$.content[1].distanceKm", closeTo(115.6, 0.1)));
    }

    @Test
    void invalidParametersReturn422() throws Exception {
        seedVisible();

        for (String query : new String[] {
                "lat=36.8",
                "lng=10.2",
                "lat=95&lng=10",
                "radiusKm=10",
                "lat=36.8&lng=10.2&radiusKm=500",
                "lat=36.8&lng=10.2&radiusKm=0",
                "sort=distance",
                "sort=foo",
                "size=0",
                "size=51",
                "page=-1"}) {
            mockMvc.perform(get(URL + "?" + query))
                    .andExpect(status().isUnprocessableEntity());
        }
    }

    // ---------- Fiche publique ----------

    @Test
    void publicProfileIsVisibleWithoutLogin() throws Exception {
        Doctor doctor = seedVisible();

        mockMvc.perform(get(URL + "/{id}", doctor.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Ali"))
                .andExpect(jsonPath("$.lastName").value("Ben Salah"))
                .andExpect(jsonPath("$.bio").value("Médecin généraliste"))
                .andExpect(jsonPath("$.phone").value("+216 70 000 000"))
                .andExpect(jsonPath("$.addressLine").value("12 rue de Marseille"))
                .andExpect(jsonPath("$.specialties[0].code").value("GENERAL_MEDICINE"))
                .andExpect(jsonPath("$.specialties[0].primary").value(true))
                .andExpect(jsonPath("$.languages.length()").value(2))
                .andExpect(jsonPath("$.licenseNumber").doesNotExist())
                .andExpect(jsonPath("$.userId").doesNotExist())
                .andExpect(jsonPath("$.verificationStatus").doesNotExist());
    }

    @Test
    void hiddenOrUnknownDoctorReturns404() throws Exception {
        Doctor pending = save("p", "Paul", "Pending", "Tunis", null, null,
                VerificationStatus.PENDING, ProfessionalStatus.ACTIVE, "ENT", "fr");
        Doctor suspended = save("s", "Sami", "Suspended", "Tunis", null, null,
                VerificationStatus.VERIFIED, ProfessionalStatus.SUSPENDED, "ENT", "fr");

        mockMvc.perform(get(URL + "/{id}", pending.getId())).andExpect(status().isNotFound());
        mockMvc.perform(get(URL + "/{id}", suspended.getId())).andExpect(status().isNotFound());
        mockMvc.perform(get(URL + "/{id}", java.util.UUID.randomUUID())).andExpect(status().isNotFound());
    }

    // ---------- Données de test ----------

    /** Retourne Ali Ben Salah. */
    private Doctor seedVisible() {
        Doctor benSalah = visible("1", "Ali", "Ben Salah", "Tunis", TUNIS_LAT, TUNIS_LNG,
                "GENERAL_MEDICINE", "fr", "ar");
        benSalah.setBio("Médecin généraliste");
        benSalah.setPhone("+216 70 000 000");
        benSalah.setAddressLine("12 rue de Marseille");
        doctorRepository.saveAndFlush(benSalah);

        visible("2", "Sana", "Trabelsi", "Ariana", 36.8665, 10.1647, "CARDIOLOGY", "fr", "en");
        visible("3", "Karim", "Gharbi", "Sousse", 35.8256, 10.6084, "DERMATOLOGY", "ar");
        visible("4", "Mehdi", "Zouari", "Sfax", 34.7406, 10.7603, "CARDIOLOGY", "fr");
        visible("5", "Leila", "Abidi", "Tunis", null, null, "PEDIATRICS", "ar");
        return benSalah;
    }

    private void seedHidden() {
        save("h1", "Hidden", "Pending", "Tunis", TUNIS_LAT, TUNIS_LNG,
                VerificationStatus.PENDING, ProfessionalStatus.ACTIVE, "ENT", "fr");
        save("h2", "Hidden", "Rejected", "Tunis", TUNIS_LAT, TUNIS_LNG,
                VerificationStatus.REJECTED, ProfessionalStatus.ACTIVE, "ENT", "fr");
        save("h3", "Hidden", "Suspended", "Tunis", TUNIS_LAT, TUNIS_LNG,
                VerificationStatus.VERIFIED, ProfessionalStatus.SUSPENDED, "ENT", "fr");
        save("h4", "Hidden", "OnLeave", "Tunis", TUNIS_LAT, TUNIS_LNG,
                VerificationStatus.VERIFIED, ProfessionalStatus.ON_LEAVE, "ENT", "fr");
        save("h5", "Hidden", "Inactive", "Tunis", TUNIS_LAT, TUNIS_LNG,
                VerificationStatus.VERIFIED, ProfessionalStatus.INACTIVE, "ENT", "fr");
    }

    private Doctor visible(String key, String first, String last, String city, Double lat, Double lng,
                           String specialtyCode, String... languages) {
        return save(key, first, last, city, lat, lng,
                VerificationStatus.VERIFIED, ProfessionalStatus.ACTIVE, specialtyCode, languages);
    }

    private Doctor save(String key, String first, String last, String city, Double lat, Double lng,
                        VerificationStatus verification, ProfessionalStatus professional,
                        String specialtyCode, String... languages) {
        Doctor doctor = new Doctor();
        doctor.setUserId("user-" + key);
        doctor.setLicenseNumber("TN-" + key);
        doctor.setFirstName(first);
        doctor.setLastName(last);
        doctor.setCity(city);
        doctor.setLatitude(lat);
        doctor.setLongitude(lng);
        doctor.setVerificationStatus(verification);
        doctor.setProfessionalStatus(professional);
        doctor.addSpecialty(specialtyRepository.findByCode(specialtyCode).orElseThrow(), true);
        for (String code : languages) {
            doctor.getLanguages().add(languageRepository.findById(code).orElseThrow());
        }
        return doctorRepository.saveAndFlush(doctor);
    }

    private static Path createTempDir() {
        try {
            return Files.createTempDirectory("diplomas-directory-test");
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}