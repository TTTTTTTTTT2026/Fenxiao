ALTER TABLE user_distribution_profile ADD COLUMN preregistration_inviter_id BIGINT NULL;
ALTER TABLE user_distribution_profile ADD COLUMN claimed_at TIMESTAMP NULL;
ALTER TABLE user_distribution_profile ADD COLUMN activated_at TIMESTAMP NULL;

CREATE TABLE subordinate_pre_registration (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    inviter_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    country_code VARCHAR(10) NOT NULL,
    phone_number VARCHAR(32) NOT NULL,
    platform_code VARCHAR(32) NOT NULL,
    platform_user_id VARCHAR(64) NOT NULL,
    active_phone VARCHAR(32) NULL UNIQUE,
    active_account VARCHAR(100) NULL UNIQUE,
    status VARCHAR(32) NOT NULL,
    reason_code VARCHAR(64) NOT NULL,
    submitted_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    next_check_at TIMESTAMP NOT NULL,
    last_checked_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    attempt_count INT NOT NULL DEFAULT 0,
    revision BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    INDEX idx_pre_registration_due (status, next_check_at),
    INDEX idx_pre_registration_inviter (inviter_id, id),
    INDEX idx_pre_registration_user (user_id)
);
CREATE TABLE subordinate_pre_registration_attempt (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    application_id BIGINT NOT NULL,
    reason_code VARCHAR(64) NOT NULL,
    checked_at TIMESTAMP NOT NULL
);

-- Stable database mutexes coordinate phone/account claims with existing registration paths.
CREATE TABLE registration_claim_mutex (slot_id INT PRIMARY KEY);
INSERT INTO registration_claim_mutex (slot_id) VALUES
(0),(1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12),(13),(14),(15),
(16),(17),(18),(19),(20),(21),(22),(23),(24),(25),(26),(27),(28),(29),(30),(31),
(32),(33),(34),(35),(36),(37),(38),(39),(40),(41),(42),(43),(44),(45),(46),(47),
(48),(49),(50),(51),(52),(53),(54),(55),(56),(57),(58),(59),(60),(61),(62),(63);
