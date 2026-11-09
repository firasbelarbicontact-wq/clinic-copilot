
package com.clinic.appointment_service.repository;

import com.clinic.appointment_service.entity.AvailabilityException;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface AvailabilityExceptionRepository
        extends JpaRepository<AvailabilityException, Long> {

    List<AvailabilityException> findByDoctorId(Long doctorId);

    List<AvailabilityException> findByDoctorIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            Long doctorId,
            LocalDate date,
            LocalDate dateAgain
    );
}
