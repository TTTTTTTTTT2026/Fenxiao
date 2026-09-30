ALTER TABLE phone_verification_code
    ADD COLUMN delivery_channel VARCHAR(24) NOT NULL DEFAULT 'UNKNOWN',
    ADD COLUMN delivery_status VARCHAR(24) NOT NULL DEFAULT 'UNKNOWN',
    ADD COLUMN delivery_error_code VARCHAR(64) NULL;
