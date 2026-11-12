-- =====================================================
-- M3 - Appointment Service - Initial schema
-- =====================================================

-- Emploi du temps hebdomadaire des medecins
CREATE TABLE doctor_schedule (
    id                   BIGSERIAL PRIMARY KEY,
    doctor_id            BIGINT       NOT NULL,
    day_of_week          VARCHAR(10)  NOT NULL,
    start_time           TIME         NOT NULL,
    end_time             TIME         NOT NULL,
    slot_duration_minutes INT         NOT NULL,
    is_active            BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_doctor_schedule_doctor ON doctor_schedule(doctor_id);

-- Exceptions de disponibilite (conges, absences)
CREATE TABLE availability_exception (
    id          BIGSERIAL PRIMARY KEY,
    doctor_id   BIGINT      NOT NULL,
    start_date  DATE        NOT NULL,
    end_date    DATE        NOT NULL,
    reason      VARCHAR(255),
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_availability_exception_doctor ON availability_exception(doctor_id);

-- Creneaux horaires generes
CREATE TABLE time_slot (
    id          BIGSERIAL PRIMARY KEY,
    doctor_id   BIGINT       NOT NULL,
    schedule_id BIGINT       REFERENCES doctor_schedule(id),
    start_time  TIMESTAMP    NOT NULL,
    end_time    TIMESTAMP    NOT NULL,
    status      VARCHAR(15)  NOT NULL DEFAULT 'FREE',
    version     BIGINT       NOT NULL DEFAULT 0
);
CREATE INDEX idx_time_slot_doctor ON time_slot(doctor_id);
CREATE INDEX idx_time_slot_status ON time_slot(status);
<<<<<<< HEAD
CREATE INDEX idx_time_slot_start  ON time_slot(start_time);
=======
CREATE INDEX idx_time_slot_start ON time_slot(start_time);
>>>>>>> origin/main

-- Rendez-vous
CREATE TABLE appointment (
    id           BIGSERIAL PRIMARY KEY,
    patient_id   BIGINT       NOT NULL,
    doctor_id    BIGINT       NOT NULL,
    time_slot_id BIGINT       UNIQUE REFERENCES time_slot(id),
    start_time   TIMESTAMP    NOT NULL,
    end_time     TIMESTAMP    NOT NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'BOOKED',
    reason       TEXT,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_appointment_slot UNIQUE (time_slot_id)
);
CREATE INDEX idx_appointment_patient ON appointment(patient_id);
<<<<<<< HEAD
CREATE INDEX idx_appointment_doctor  ON appointment(doctor_id);
CREATE INDEX idx_appointment_status  ON appointment(status);
CREATE INDEX idx_appointment_start   ON appointment(start_time);
=======
CREATE INDEX idx_appointment_doctor ON appointment(doctor_id);
CREATE INDEX idx_appointment_status ON appointment(status);
CREATE INDEX idx_appointment_start ON appointment(start_time);
>>>>>>> origin/main
