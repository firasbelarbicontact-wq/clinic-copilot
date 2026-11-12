CREATE TABLE reviews (
    id                UUID PRIMARY KEY,
    doctor_id         UUID         NOT NULL,
    patient_id        UUID         NOT NULL,
    rating            INTEGER      NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment           VARCHAR(1000),
    author_name       VARCHAR(60)  NOT NULL DEFAULT 'Patient',
    status            VARCHAR(20)  NOT NULL DEFAULT 'PUBLISHED',
    moderation_reason VARCHAR(300),
    created_at        TIMESTAMPTZ  NOT NULL,
    updated_at        TIMESTAMPTZ  NOT NULL,
    CONSTRAINT uq_reviews_doctor_patient UNIQUE (doctor_id, patient_id)
);

CREATE INDEX idx_reviews_doctor_status ON reviews (doctor_id, status);
CREATE INDEX idx_reviews_patient ON reviews (patient_id);