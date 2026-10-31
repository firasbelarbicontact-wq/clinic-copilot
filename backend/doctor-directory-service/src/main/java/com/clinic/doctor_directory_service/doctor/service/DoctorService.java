package com.clinic.doctor_directory_service.doctor.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.clinic.doctor_directory_service.common.exception.BusinessRuleException;
import com.clinic.doctor_directory_service.common.exception.ConflictException;
import com.clinic.doctor_directory_service.common.exception.ResourceNotFoundException;
import com.clinic.doctor_directory_service.common.security.CurrentUser;
import com.clinic.doctor_directory_service.doctor.dto.DoctorProfileRequest;
import com.clinic.doctor_directory_service.doctor.dto.DoctorProfileResponse;
import com.clinic.doctor_directory_service.doctor.entity.Doctor;
import com.clinic.doctor_directory_service.doctor.entity.VerificationStatus;
import com.clinic.doctor_directory_service.doctor.mapper.DoctorMapper;
import com.clinic.doctor_directory_service.doctor.repository.DoctorRepository;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepository;

    public DoctorService(DoctorRepository doctorRepository) {
        this.doctorRepository = doctorRepository;
    }

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
        if (licenseChanged) {
            // Un changement du numéro d'ordre doit être revérifié par un administrateur.
            doctor.setVerificationStatus(VerificationStatus.PENDING);
        }
        return DoctorMapper.toResponse(doctor);
    }

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