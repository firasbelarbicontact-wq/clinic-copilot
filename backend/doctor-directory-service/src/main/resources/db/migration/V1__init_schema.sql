CREATE TABLE specialty (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code        VARCHAR(50)  NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(500)
);

CREATE TABLE language (
    code VARCHAR(2)  PRIMARY KEY,
    name VARCHAR(60) NOT NULL
);

CREATE TABLE doctor (
    id                  UUID PRIMARY KEY,
    user_id             VARCHAR(64)  NOT NULL UNIQUE,
    first_name          VARCHAR(80)  NOT NULL,
    last_name           VARCHAR(80)  NOT NULL,
    title               VARCHAR(30),
    bio                 VARCHAR(2000),
    license_number      VARCHAR(50)  NOT NULL UNIQUE,
    years_experience    INTEGER,
    phone               VARCHAR(30),
    address_line        VARCHAR(200),
    city                VARCHAR(100),
    governorate         VARCHAR(100),
    postal_code         VARCHAR(10),
    latitude            DOUBLE PRECISION,
    longitude           DOUBLE PRECISION,
    verification_status VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    professional_status VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    version             BIGINT       NOT NULL DEFAULT 0,
    CONSTRAINT chk_doctor_verification
        CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    CONSTRAINT chk_doctor_professional
        CHECK (professional_status IN ('ACTIVE', 'ON_LEAVE', 'INACTIVE', 'SUSPENDED')),
    CONSTRAINT chk_doctor_years CHECK (years_experience IS NULL OR years_experience BETWEEN 0 AND 70),
    CONSTRAINT chk_doctor_lat CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    CONSTRAINT chk_doctor_lng CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
    CONSTRAINT chk_doctor_coords_pair CHECK ((latitude IS NULL) = (longitude IS NULL))
);

CREATE INDEX idx_doctor_visibility ON doctor (verification_status, professional_status);
CREATE INDEX idx_doctor_last_name  ON doctor (lower(last_name));
CREATE INDEX idx_doctor_city       ON doctor (lower(city));
CREATE INDEX idx_doctor_coords     ON doctor (latitude, longitude);

CREATE TABLE doctor_specialty (
    doctor_id    UUID    NOT NULL REFERENCES doctor (id) ON DELETE CASCADE,
    specialty_id BIGINT  NOT NULL REFERENCES specialty (id),
    is_primary   BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (doctor_id, specialty_id)
);

CREATE UNIQUE INDEX uq_doctor_one_primary_specialty
    ON doctor_specialty (doctor_id) WHERE is_primary;
CREATE INDEX idx_doctor_specialty_specialty ON doctor_specialty (specialty_id);

CREATE TABLE doctor_language (
    doctor_id     UUID       NOT NULL REFERENCES doctor (id) ON DELETE CASCADE,
    language_code VARCHAR(2) NOT NULL REFERENCES language (code),
    PRIMARY KEY (doctor_id, language_code)
);

CREATE INDEX idx_doctor_language_code ON doctor_language (language_code);

CREATE TABLE diploma (
    id                UUID PRIMARY KEY,
    doctor_id         UUID         NOT NULL REFERENCES doctor (id) ON DELETE CASCADE,
    type              VARCHAR(20)  NOT NULL,
    title             VARCHAR(150) NOT NULL,
    institution       VARCHAR(150),
    year_obtained     INTEGER,
    original_filename VARCHAR(255) NOT NULL,
    storage_path      VARCHAR(500) NOT NULL,
    content_type      VARCHAR(100) NOT NULL,
    size_bytes        BIGINT       NOT NULL,
    sha256            VARCHAR(64)  NOT NULL,
    status            VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    rejection_reason  VARCHAR(500),
    reviewed_by       VARCHAR(64),
    reviewed_at       TIMESTAMPTZ,
    uploaded_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_diploma_type   CHECK (type IN ('DIPLOMA', 'LICENSE', 'OTHER')),
    CONSTRAINT chk_diploma_status CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED'))
);

CREATE INDEX idx_diploma_doctor ON diploma (doctor_id, status);

CREATE TABLE doctor_status_history (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    doctor_id   UUID         NOT NULL REFERENCES doctor (id) ON DELETE CASCADE,
    status_type VARCHAR(20)  NOT NULL,
    old_value   VARCHAR(20),
    new_value   VARCHAR(20)  NOT NULL,
    changed_by  VARCHAR(64)  NOT NULL,
    reason      VARCHAR(500),
    changed_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_history_type CHECK (status_type IN ('VERIFICATION', 'PROFESSIONAL'))
);

CREATE INDEX idx_status_history_doctor ON doctor_status_history (doctor_id, changed_at);