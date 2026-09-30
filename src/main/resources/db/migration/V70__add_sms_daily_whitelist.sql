CREATE TABLE sms_daily_whitelist (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    phone_number VARCHAR(32) NOT NULL,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_sms_daily_whitelist_phone UNIQUE (phone_number)
);
