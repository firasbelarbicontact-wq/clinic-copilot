-- Prevent duplicate slot start times for the same doctor.
CREATE UNIQUE INDEX uk_time_slot_doctor_start
    ON time_slot (doctor_id, start_time);

-- Validate that a slot has a positive duration.
ALTER TABLE time_slot
    ADD CONSTRAINT chk_time_slot_valid_interval
    CHECK (end_time > start_time);

-- Validate schedule configuration.
ALTER TABLE doctor_schedule
    ADD CONSTRAINT chk_doctor_schedule_valid_interval
    CHECK (end_time > start_time);

ALTER TABLE doctor_schedule
    ADD CONSTRAINT chk_doctor_schedule_positive_duration
    CHECK (slot_duration_minutes > 0);

-- Validate availability exception dates.
ALTER TABLE availability_exception
    ADD CONSTRAINT chk_availability_exception_dates
    CHECK (end_date >= start_date);