package com.clinic.doctor_directory_service.doctor.service;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.clinic.doctor_directory_service.common.exception.BusinessRuleException;
import com.clinic.doctor_directory_service.common.exception.ConflictException;
import com.clinic.doctor_directory_service.common.exception.ResourceNotFoundException;
import com.clinic.doctor_directory_service.common.security.CurrentUser;
import com.clinic.doctor_directory_service.doctor.dto.DoctorProfileRequest;
import com.clinic.doctor_directory_service.doctor.dto.DoctorProfileResponse;
import com.clinic.doctor_directory_service.doctor.dto.UpdateLanguagesRequest;
import com.clinic.doctor_directory_service.doctor.dto.UpdateSpecialtiesRequest;
import com.clinic.doctor_directory_service.doctor.dto.UpdateStatusRequest;
import com.clinic.doctor_directory_service.doctor.entity.Doctor;
import com.clinic.doctor_directory_service.doctor.entity.DoctorStatusHistory;
import com.clinic.doctor_directory_service.doctor.entity.Language;
import com.clinic.doctor_directory_service.doctor.entity.ProfessionalStatus;
import com.clinic.doctor_directory_service.doctor.entity.Specialty;
import com.clinic.doctor_directory_service.doctor.entity.StatusType;
import com.clinic.doctor_directory_service.doctor.entity.VerificationStatus;
import com.clinic.doctor_directory_service.doctor.mapper.DoctorMapper;
import com.clinic.doctor_directory_service.doctor.repository.DoctorRepository;
import com.clinic.doctor_directory_service.doctor.repository.DoctorStatusHistoryRepository;
import com.clinic.doctor_directory_service.doctor.repository.LanguageRepository;
import com.clinic.doctor_directory_service.doctor.repository.SpecialtyRepository;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final SpecialtyRepository specialtyRepository;
    private final LanguageRepository languageRepository;
    private final DoctorStatusHistoryRepository historyRepository;

    public DoctorService(DoctorRepository doctorRepository,
                         SpecialtyRepository specialtyRepository,
                         LanguageRepository languageRepository,
                         DoctorStatusHistoryRepository historyRepository) {
        this.doctorRepository = doctorRepository;
        this.specialtyRepository = specialtyRepository;
        this.languageRepository = languageRepository;
        this.historyRepository = historyRepository;
    }

    // ---------- Profil ----------

    @Transactional
    public DoctorProfileResponse createMyProfile(DoctorProfileRequest request) {
        String userId = CurrentUser.id();
        if (doctorRepository.existsByUserId(userId)) {
            throw new ConflictException("Un profil médecin existe déjà pour ce compte.");
        }
        String licenseNumber = request.licenseNumber().trim();
        if (doctorRepository.existsByLicenseNumber(licenseNumber)) {
            throw new ConflictException("Ce numéro d'ordre est déjà utilisé.");
        }
        requireConsistentCoordinates(request);

        Doctor doctor = new Doctor();
        doctor.setUserId(userId);
        apply(doctor, request);
        return DoctorMapper.toResponse(doctorRepository.save(doctor));
    }

    @Transactional(readOnly = true)
    public DoctorProfileResponse getMyProfile() {
        return DoctorMapper.toResponse(findMine());
    }

    @Transactional
    public DoctorProfileResponse updateMyProfile(DoctorProfileRequest request) {
        Doctor doctor = findMine();
        requireConsistentCoordinates(request);

        String newLicenseNumber = request.licenseNumber().trim();
        boolean licenseChanged = !newLicenseNumber.equals(doctor.getLicenseNumber());
        if (licenseChanged && doctorRepository.existsByLicenseNumber(newLicenseNumber)) {
            throw new ConflictException("Ce numéro d'ordre est déjà utilisé.");
        }

         apply(doctor, request);
        VerificationStatus previous = doctor.getVerificationStatus();
        if (licenseChanged && previous != VerificationStatus.PENDING) {
            // Un changement du numéro d'ordre doit être revérifié par un administrateur.
            doctor.setVerificationStatus(VerificationStatus.PENDING);
            historyRepository.save(new DoctorStatusHistory(doctor.getId(), StatusType.VERIFICATION,
                    previous.name(), VerificationStatus.PENDING.name(), CurrentUser.id(),
                    "Numéro d'ordre modifié"));
        }
        return DoctorMapper.toResponse(doctor);
    }

    // ---------- Spécialités ----------

    @Transactional
    public DoctorProfileResponse updateMySpecialties(UpdateSpecialtiesRequest request) {
        Doctor doctor = findMine();

        Set<String> codes = request.specialtyCodes().stream()
                .map(code -> code.trim().toUpperCase(Locale.ROOT))
                .collect(Collectors.toCollection(LinkedHashSet::new));
        String primaryCode = request.primaryCode().trim().toUpperCase(Locale.ROOT);
        if (!codes.contains(primaryCode)) {
            throw new BusinessRuleException("La spécialité principale doit faire partie de la liste.");
        }

        Map<String, Specialty> found = specialtyRepository.findByCodeIn(codes).stream()
                .collect(Collectors.toMap(Specialty::getCode, Function.identity()));
        List<String> unknown = codes.stream().filter(code -> !found.containsKey(code)).toList();
        if (!unknown.isEmpty()) {
            throw new BusinessRuleException("Spécialité(s) inconnue(s) : " + String.join(", ", unknown));
        }

        // Phase 1 : retirer les spécialités supprimées et enlever l'ancien "principal".
        // Le flush intermédiaire évite de violer l'index unique "une seule spécialité principale".
        doctor.getSpecialties().removeIf(link -> !codes.contains(link.getSpecialty().getCode()));
        doctor.getSpecialties().forEach(link -> link.setPrimarySpecialty(false));
        doctorRepository.flush();

        // Phase 2 : ajouter les nouvelles et désigner la principale.
        Set<String> existing = doctor.getSpecialties().stream()
                .map(link -> link.getSpecialty().getCode())
                .collect(Collectors.toSet());
        for (String code : codes) {
            if (!existing.contains(code)) {
                doctor.addSpecialty(found.get(code), false);
            }
        }
        doctor.getSpecialties().stream()
                .filter(link -> link.getSpecialty().getCode().equals(primaryCode))
                .forEach(link -> link.setPrimarySpecialty(true));
        doctorRepository.flush();

        return DoctorMapper.toResponse(doctor);
    }

    // ---------- Langues ----------

    @Transactional
    public DoctorProfileResponse updateMyLanguages(UpdateLanguagesRequest request) {
        Doctor doctor = findMine();

        Set<String> codes = request.languageCodes().stream()
                .map(code -> code.trim().toLowerCase(Locale.ROOT))
                .collect(Collectors.toCollection(LinkedHashSet::new));

        List<Language> found = languageRepository.findAllById(codes);
        if (found.size() != codes.size()) {
            Set<String> foundCodes = found.stream().map(Language::getCode).collect(Collectors.toSet());
            List<String> unknown = codes.stream().filter(code -> !foundCodes.contains(code)).toList();
            throw new BusinessRuleException("Langue(s) inconnue(s) : " + String.join(", ", unknown));
        }

        doctor.getLanguages().retainAll(found);
        doctor.getLanguages().addAll(found);
        return DoctorMapper.toResponse(doctor);
    }

    // ---------- Statut professionnel ----------

    @Transactional
    public DoctorProfileResponse updateMyStatus(UpdateStatusRequest request) {
        Doctor doctor = findMine();
        ProfessionalStatus current = doctor.getProfessionalStatus();
        ProfessionalStatus target = request.status();

        if (current == ProfessionalStatus.SUSPENDED) {
            throw new BusinessRuleException("Votre profil est suspendu : contactez un administrateur.");
        }
        if (target == ProfessionalStatus.SUSPENDED) {
            throw new BusinessRuleException("Seul un administrateur peut suspendre un profil.");
        }
        if (target != current) {
            doctor.setProfessionalStatus(target);
            historyRepository.save(new DoctorStatusHistory(
                    doctor.getId(), StatusType.PROFESSIONAL, current.name(), target.name(), CurrentUser.id(), null));
        }
        return DoctorMapper.toResponse(doctor);
    }

    // ---------- Utilitaires ----------

    private Doctor findMine() {
        return doctorRepository.findByUserId(CurrentUser.id())
                .orElseThrow(() -> new ResourceNotFoundException("Aucun profil médecin n'existe pour ce compte."));
    }

    private static void requireConsistentCoordinates(DoctorProfileRequest request) {
        if ((request.latitude() == null) != (request.longitude() == null)) {
            throw new BusinessRuleException("La latitude et la longitude doivent être renseignées ensemble.");
        }
    }

    private static void apply(Doctor doctor, DoctorProfileRequest request) {
        doctor.setFirstName(request.firstName().trim());
        doctor.setLastName(request.lastName().trim());
        doctor.setTitle(clean(request.title()));
        doctor.setBio(clean(request.bio()));
        doctor.setLicenseNumber(request.licenseNumber().trim());
        doctor.setYearsExperience(request.yearsExperience());
        doctor.setPhone(clean(request.phone()));
        doctor.setAddressLine(clean(request.addressLine()));
        doctor.setCity(clean(request.city()));
        doctor.setGovernorate(clean(request.governorate()));
        doctor.setPostalCode(clean(request.postalCode()));
        doctor.setLatitude(request.latitude());
        doctor.setLongitude(request.longitude());
    }

    private static String clean(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}