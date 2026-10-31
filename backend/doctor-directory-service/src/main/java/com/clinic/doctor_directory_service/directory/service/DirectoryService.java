package com.clinic.doctor_directory_service.directory.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.clinic.doctor_directory_service.common.api.PageResponse;
import com.clinic.doctor_directory_service.common.exception.BusinessRuleException;
import com.clinic.doctor_directory_service.common.exception.ResourceNotFoundException;
import com.clinic.doctor_directory_service.directory.dto.PublicDoctorDetail;
import com.clinic.doctor_directory_service.directory.dto.PublicDoctorSummary;
import com.clinic.doctor_directory_service.directory.geo.GeoUtils;
import com.clinic.doctor_directory_service.directory.geo.GeoUtils.BoundingBox;
import com.clinic.doctor_directory_service.doctor.dto.DoctorProfileResponse.LanguageView;
import com.clinic.doctor_directory_service.doctor.dto.DoctorProfileResponse.SpecialtyView;
import com.clinic.doctor_directory_service.doctor.entity.Doctor;
import com.clinic.doctor_directory_service.doctor.entity.DoctorSpecialty;
import com.clinic.doctor_directory_service.doctor.entity.ProfessionalStatus;
import com.clinic.doctor_directory_service.doctor.entity.Specialty;
import com.clinic.doctor_directory_service.doctor.entity.VerificationStatus;
import com.clinic.doctor_directory_service.doctor.repository.DoctorRepository;

import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;

@Service
public class DirectoryService {

    static final int MAX_SIZE = 50;
    static final double MAX_RADIUS_KM = 200;

    private static final Sort NAME_SORT = Sort.by(
            Sort.Order.asc("lastName").ignoreCase(),
            Sort.Order.asc("firstName").ignoreCase(),
            Sort.Order.asc("id"));

    private static final Comparator<Located> BY_DISTANCE =
            Comparator.comparing(Located::distanceKm, Comparator.nullsLast(Comparator.naturalOrder()));

    private final DoctorRepository doctorRepository;

    public DirectoryService(DoctorRepository doctorRepository) {
        this.doctorRepository = doctorRepository;
    }

    @Transactional(readOnly = true)
    public PageResponse<PublicDoctorSummary> search(String q, String specialty, String language, String city,
                                                    Double lat, Double lng, Double radiusKm, String sort,
                                                    int page, int size) {
        if (page < 0) {
            throw new BusinessRuleException("La page doit être supérieure ou égale à 0.");
        }
        if (size < 1 || size > MAX_SIZE) {
            throw new BusinessRuleException("La taille de page doit être comprise entre 1 et " + MAX_SIZE + ".");
        }
        if ((lat == null) != (lng == null)) {
            throw new BusinessRuleException("Les paramètres lat et lng doivent être fournis ensemble.");
        }
        if (lat != null && (!(lat >= -90 && lat <= 90) || !(lng >= -180 && lng <= 180))) {
            throw new BusinessRuleException("Position invalide.");
        }
        if (radiusKm != null) {
            if (lat == null) {
                throw new BusinessRuleException("Le paramètre radiusKm exige lat et lng.");
            }
            if (!(radiusKm > 0 && radiusKm <= MAX_RADIUS_KM)) {
                throw new BusinessRuleException("radiusKm doit être compris entre 0 et " + (int) MAX_RADIUS_KM + ".");
            }
        }
        String sortKey = clean(sort, 20, "sort");
        if (sortKey != null) {
            sortKey = sortKey.toLowerCase(Locale.ROOT);
            if (!sortKey.equals("name") && !sortKey.equals("distance")) {
                throw new BusinessRuleException("Le tri doit être « name » ou « distance ».");
            }
            if (sortKey.equals("distance") && lat == null) {
                throw new BusinessRuleException("Le tri par distance exige lat et lng.");
            }
        }

        String name = clean(q, 100, "q");
        String specialtyCode = clean(specialty, 50, "specialty");
        String languageCode = clean(language, 2, "language");
        String cityName = clean(city, 100, "city");

        BoundingBox box = radiusKm == null ? null : GeoUtils.boundingBox(lat, lng, radiusKm);
        Specification<Doctor> spec = visibleDoctors(name,
                specialtyCode == null ? null : specialtyCode.toUpperCase(Locale.ROOT),
                languageCode == null ? null : languageCode.toLowerCase(Locale.ROOT),
                cityName == null ? null : cityName.toLowerCase(Locale.ROOT),
                box);

        // Sans position : pagination faite par la base.
        if (lat == null) {
            Page<Doctor> result = doctorRepository.findAll(spec, PageRequest.of(page, size, NAME_SORT));
            return PageResponse.of(result.map(doctor -> toSummary(doctor, null)));
        }

        // Avec position : distances calculées ici, tri et pagination ensuite.
        List<Located> located = doctorRepository.findAll(spec, NAME_SORT).stream()
                .map(doctor -> new Located(doctor, doctor.getLatitude() == null ? null
                        : GeoUtils.distanceKm(lat, lng, doctor.getLatitude(), doctor.getLongitude())))
                .filter(l -> radiusKm == null || (l.distanceKm() != null && l.distanceKm() <= radiusKm))
                .toList();
        if (!"name".equals(sortKey)) {
            located = located.stream().sorted(BY_DISTANCE).toList(); // tri stable : nom en cas d'égalité
        }

        long total = located.size();
        int from = (int) Math.min((long) page * size, total);
        int to = (int) Math.min(from + (long) size, total);
        List<PublicDoctorSummary> content = located.subList(from, to).stream()
                .map(l -> toSummary(l.doctor(), l.distanceKm()))
                .toList();
        int totalPages = (int) Math.ceil((double) total / size);
        return new PageResponse<>(content, page, size, total, totalPages);
    }

    @Transactional(readOnly = true)
    public PublicDoctorDetail get(UUID id) {
        Doctor doctor = doctorRepository.findById(id)
                .filter(d -> d.getVerificationStatus() == VerificationStatus.VERIFIED
                        && d.getProfessionalStatus() == ProfessionalStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Médecin introuvable"));
        return new PublicDoctorDetail(
                doctor.getId(),
                doctor.getTitle(),
                doctor.getFirstName(),
                doctor.getLastName(),
                doctor.getBio(),
                doctor.getYearsExperience(),
                doctor.getPhone(),
                doctor.getAddressLine(),
                doctor.getCity(),
                doctor.getGovernorate(),
                doctor.getPostalCode(),
                doctor.getLatitude(),
                doctor.getLongitude(),
                specialtiesOf(doctor),
                languagesOf(doctor));
    }

    // ---------- Requête ----------

    private static Specification<Doctor> visibleDoctors(String name, String specialtyCode, String languageCode,
                                                        String city, BoundingBox box) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("verificationStatus"), VerificationStatus.VERIFIED));
            predicates.add(cb.equal(root.get("professionalStatus"), ProfessionalStatus.ACTIVE));

            if (name != null) {
                String pattern = "%" + escapeLike(name.toLowerCase(Locale.ROOT)) + "%";
                Expression<String> first = cb.lower(root.<String>get("firstName"));
                Expression<String> last = cb.lower(root.<String>get("lastName"));
                Expression<String> firstLast = cb.concat(cb.concat(first, " "), last);
                Expression<String> lastFirst = cb.concat(cb.concat(last, " "), first);
                predicates.add(cb.or(cb.like(firstLast, pattern, '\\'), cb.like(lastFirst, pattern, '\\')));
            }
            if (specialtyCode != null) {
                Join<Doctor, DoctorSpecialty> link = root.join("specialties");
                Join<DoctorSpecialty, Specialty> joined = link.join("specialty");
                predicates.add(cb.equal(joined.get("code"), specialtyCode));
            }
            if (languageCode != null) {
                predicates.add(cb.equal(root.join("languages").get("code"), languageCode));
            }
            if (city != null) {
                predicates.add(cb.equal(cb.lower(root.<String>get("city")), city));
            }
            if (box != null) {
                predicates.add(cb.between(root.<Double>get("latitude"), box.minLat(), box.maxLat()));
                predicates.add(cb.between(root.<Double>get("longitude"), box.minLng(), box.maxLng()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    // ---------- Conversion ----------

    private static PublicDoctorSummary toSummary(Doctor doctor, Double distanceKm) {
        Double rounded = distanceKm == null ? null : Math.round(distanceKm * 10) / 10.0;
        return new PublicDoctorSummary(
                doctor.getId(),
                doctor.getTitle(),
                doctor.getFirstName(),
                doctor.getLastName(),
                doctor.getCity(),
                doctor.getGovernorate(),
                doctor.getYearsExperience(),
                specialtiesOf(doctor),
                languagesOf(doctor),
                rounded);
    }

    private static List<SpecialtyView> specialtiesOf(Doctor doctor) {
        return doctor.getSpecialties().stream()
                .map(link -> new SpecialtyView(link.getSpecialty().getCode(), link.getSpecialty().getName(),
                        link.isPrimarySpecialty()))
                .sorted(Comparator.comparing((SpecialtyView s) -> !s.primary()).thenComparing(SpecialtyView::name))
                .toList();
    }

    private static List<LanguageView> languagesOf(Doctor doctor) {
        return doctor.getLanguages().stream()
                .map(language -> new LanguageView(language.getCode(), language.getName()))
                .sorted(Comparator.comparing(LanguageView::code))
                .toList();
    }

    // ---------- Utilitaires ----------

    private static String clean(String value, int maxLength, String parameter) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.length() > maxLength) {
            throw new BusinessRuleException("Le paramètre " + parameter + " est trop long.");
        }
        return trimmed;
    }

    private static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    private record Located(Doctor doctor, Double distanceKm) {
    }
}