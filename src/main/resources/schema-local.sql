-- Local-only schema supplement for JDBC-backed income shadow projections.
-- Production creates these structures through Flyway migrations V34-V36.

-- Production creates this table through Flyway V49. Local acceptance disables
-- Flyway, so keep the long-lived token-to-points configuration available after
-- upgrading an existing local H2 database.
CREATE TABLE IF NOT EXISTS token_point_conversion_version (
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
    CONSTRAINT uk_token_point_conversion_version UNIQUE (conversion_code, conversion_version)
);

CREATE INDEX IF NOT EXISTS idx_token_point_conversion_active
    ON token_point_conversion_version(platform_code, rule_status, effective_from);

CREATE TABLE IF NOT EXISTS mcn_income_shadow_ledger_projection (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    source_system VARCHAR(32) NOT NULL,
    platform_code VARCHAR(32) NOT NULL,
    source_event_id VARCHAR(128) NOT NULL,
    raw_ledger_event_id BIGINT NOT NULL,
    source_revision VARCHAR(512) NOT NULL,
    business_date DATE NOT NULL,
    guild_id VARCHAR(64),
    resolved_user_id BIGINT,
    settlement_status VARCHAR(32) NOT NULL,
    event_type VARCHAR(32) NOT NULL,
    amount DECIMAL(18,6) NOT NULL,
    amount_unit VARCHAR(32) NOT NULL,
    currency_code VARCHAR(16) NOT NULL,
    shadow_status VARCHAR(32) NOT NULL,
    source_updated_at TIMESTAMP NOT NULL,
    projected_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_mcn_income_shadow_projection UNIQUE (source_system, platform_code, source_event_id)
);

CREATE INDEX IF NOT EXISTS idx_mcn_income_shadow_day_status
    ON mcn_income_shadow_ledger_projection(platform_code, business_date, shadow_status);

CREATE TABLE IF NOT EXISTS mcn_income_shadow_ledger_run (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    run_id VARCHAR(64) NOT NULL,
    platform_code VARCHAR(32) NOT NULL,
    business_date DATE NOT NULL,
    source_fact_count INT NOT NULL,
    latest_fact_count INT NOT NULL,
    bound_final_count INT NOT NULL,
    unmatched_count INT NOT NULL,
    awaiting_finality_count INT NOT NULL,
    voided_count INT NOT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_mcn_income_shadow_run UNIQUE (run_id)
);

CREATE INDEX IF NOT EXISTS idx_mcn_income_shadow_run_day
    ON mcn_income_shadow_ledger_run(platform_code, business_date, completed_at);

CREATE TABLE IF NOT EXISTS mcn_income_reward_candidate_projection (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    source_system VARCHAR(32) NOT NULL,
    platform_code VARCHAR(32) NOT NULL,
    source_event_id VARCHAR(128) NOT NULL,
    raw_ledger_event_id BIGINT NOT NULL,
    source_revision VARCHAR(512) NOT NULL,
    business_date DATE NOT NULL,
    occurred_at TIMESTAMP NOT NULL,
    source_user_id BIGINT,
    recipient_user_id BIGINT,
    reward_level INT NOT NULL,
    invitation_version_no INT,
    rule_id BIGINT,
    commission_policy_id BIGINT,
    commission_policy_code VARCHAR(64),
    rule_rate DECIMAL(8,6),
    base_amount DECIMAL(18,6) NOT NULL,
    candidate_amount DECIMAL(18,6),
    currency_code VARCHAR(16) NOT NULL,
    amount_unit VARCHAR(32) NOT NULL,
    candidate_status VARCHAR(64) NOT NULL,
    decision_reason VARCHAR(128) NOT NULL,
    projected_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_mcn_income_reward_candidate UNIQUE (source_system, platform_code, source_event_id, reward_level)
);

ALTER TABLE mcn_income_reward_candidate_projection
    ADD COLUMN IF NOT EXISTS commission_policy_id BIGINT;
ALTER TABLE mcn_income_reward_candidate_projection
    ADD COLUMN IF NOT EXISTS commission_policy_code VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_mcn_income_reward_candidate_day
    ON mcn_income_reward_candidate_projection(platform_code, business_date, candidate_status);
CREATE INDEX IF NOT EXISTS idx_mcn_income_reward_candidate_recipient
    ON mcn_income_reward_candidate_projection(recipient_user_id, candidate_status);

CREATE TABLE IF NOT EXISTS mcn_income_reward_candidate_run (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    run_id VARCHAR(64) NOT NULL,
    platform_code VARCHAR(32) NOT NULL,
    business_date DATE NOT NULL,
    source_fact_count INT NOT NULL,
    source_ready_count INT NOT NULL,
    candidate_count INT NOT NULL,
    blocked_count INT NOT NULL,
    candidate_amount DECIMAL(18,6) NOT NULL,
    amount_unit VARCHAR(32),
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_mcn_income_reward_candidate_run UNIQUE (run_id)
);

CREATE INDEX IF NOT EXISTS idx_mcn_income_reward_candidate_run_day
    ON mcn_income_reward_candidate_run(platform_code, business_date, completed_at);

CREATE TABLE IF NOT EXISTS mcn_income_data_quality_review (
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
    CONSTRAINT uk_mcn_income_quality_review_revision UNIQUE (source_system, platform_code, source_event_id, source_revision)
);

CREATE INDEX IF NOT EXISTS idx_mcn_income_quality_review_lookup
    ON mcn_income_data_quality_review(platform_code, source_event_id);
