CREATE TABLE token_point_conversion_version (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    conversion_code VARCHAR(64) NOT NULL,
    conversion_version INT NOT NULL,
    platform_code VARCHAR(32) NOT NULL,
    token_unit VARCHAR(32) NOT NULL,
    points_per_token DECIMAL(18,6) NOT NULL,
    effective_from TIMESTAMP NOT NULL,
    effective_to TIMESTAMP NULL,
    rule_status VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
    created_by BIGINT NULL,
    approved_by BIGINT NULL,
    approved_at TIMESTAMP NULL,
    approval_note VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_token_point_conversion_version (conversion_code, conversion_version),
    INDEX idx_token_point_conversion_active (platform_code, rule_status, effective_from)
);
