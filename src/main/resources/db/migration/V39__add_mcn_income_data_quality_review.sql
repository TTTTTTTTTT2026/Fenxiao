CREATE TABLE mcn_income_data_quality_review (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    source_system VARCHAR(32) NOT NULL,
    platform_code VARCHAR(32) NOT NULL,
    source_event_id VARCHAR(128) NOT NULL,
    source_revision VARCHAR(512) NOT NULL,
    review_status VARCHAR(32) NOT NULL,
    review_note VARCHAR(255) NOT NULL,
    reviewed_by BIGINT NOT NULL,
    reviewed_role VARCHAR(32) NOT NULL,
    reviewed_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_mcn_income_quality_review_revision UNIQUE (source_system, platform_code, source_event_id, source_revision),
    INDEX idx_mcn_income_quality_review_lookup (platform_code, source_event_id)
);
