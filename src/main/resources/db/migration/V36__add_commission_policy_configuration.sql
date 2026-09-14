CREATE TABLE commission_policy (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    policy_code VARCHAR(64) NOT NULL,
    platform_code VARCHAR(32) NOT NULL,
    country_code VARCHAR(10) NOT NULL,
    role_code VARCHAR(32) NOT NULL,
    max_reward_level INT NOT NULL,
    level1_enabled BOOLEAN NOT NULL,
    level1_rate DECIMAL(8,6) NULL,
    level1_freeze_days INT NULL,
    level2_enabled BOOLEAN NOT NULL,
    level2_rate DECIMAL(8,6) NULL,
    level2_freeze_days INT NULL,
    level3_enabled BOOLEAN NOT NULL,
    level3_rate DECIMAL(8,6) NULL,
    level3_freeze_days INT NULL,
    effective_from TIMESTAMP NOT NULL,
    effective_to TIMESTAMP NULL,
    status VARCHAR(32) NOT NULL,
    created_by BIGINT NOT NULL,
    approved_by BIGINT NULL,
    approved_at TIMESTAMP NULL,
    approval_note VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_commission_policy_code UNIQUE (policy_code),
    INDEX idx_commission_policy_effective (platform_code, country_code, role_code, status, effective_from)
);

ALTER TABLE mcn_income_reward_candidate_projection ADD COLUMN commission_policy_id BIGINT NULL;
ALTER TABLE mcn_income_reward_candidate_projection ADD COLUMN commission_policy_code VARCHAR(64) NULL;
