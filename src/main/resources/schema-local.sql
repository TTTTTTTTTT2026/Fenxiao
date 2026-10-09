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

-- Mentor list and historical shadow records are backed by JDBC tables. These
-- are created by Flyway V18 and V43 in production; local acceptance keeps
-- Flyway disabled and therefore must create the same read-model structures.
CREATE TABLE IF NOT EXISTS incentive_rule_version (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rule_code VARCHAR(64) NOT NULL,
    rule_version INT NOT NULL,
    reward_type VARCHAR(32) NOT NULL,
    milestone_code VARCHAR(64) NOT NULL,
    platform_code VARCHAR(32) NOT NULL,
    country_code VARCHAR(10) NOT NULL,
    guild_id VARCHAR(64),
    amount_minor BIGINT NOT NULL,
    currency_code VARCHAR(16) NOT NULL,
    freeze_days INT NOT NULL DEFAULT 0,
    effective_from TIMESTAMP NOT NULL,
    effective_to TIMESTAMP,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    rule_status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    created_by BIGINT NULL,
    approved_by BIGINT NULL,
    approved_at TIMESTAMP NULL,
    approval_note VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_incentive_rule_version UNIQUE (rule_code, rule_version)
);

CREATE INDEX IF NOT EXISTS idx_incentive_rule_admin_list
    ON incentive_rule_version(reward_type, rule_status, effective_from);

CREATE TABLE IF NOT EXISTS incentive_shadow_ledger (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    idempotency_key VARCHAR(160) NOT NULL,
    recipient_user_id BIGINT NOT NULL,
    source_user_id BIGINT NOT NULL,
    platform_code VARCHAR(32) NOT NULL,
    platform_user_id VARCHAR(64) NOT NULL,
    reward_type VARCHAR(32) NOT NULL,
    milestone_code VARCHAR(64) NOT NULL,
    rule_id BIGINT NOT NULL,
    rule_version INT NOT NULL,
    amount_minor BIGINT NOT NULL,
    currency_code VARCHAR(16) NOT NULL,
    ledger_status VARCHAR(32) NOT NULL,
    source_snapshot_id BIGINT,
    triggered_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_incentive_shadow_idempotency UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_incentive_shadow_recipient
    ON incentive_shadow_ledger(recipient_user_id, reward_type, ledger_status);

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

-- The client effective-user page reads the same qualified facts as production.
-- Local H2 runs without Flyway, so this table must be present for acceptance.
CREATE TABLE IF NOT EXISTS effective_user_qualification_fact (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    platform_code VARCHAR(32) NOT NULL,
    qualification_status VARCHAR(32) NOT NULL,
    first_income_at TIMESTAMP NULL,
    observation_ends_at TIMESTAMP NULL,
    qualifying_income_date_count INT NOT NULL DEFAULT 0,
    qualifying_income_dates VARCHAR(255) NULL,
    latest_income_at TIMESTAMP NULL,
    source_evidence_snapshot VARCHAR(1024) NULL,
    qualified_at TIMESTAMP NULL,
    evidence_revoked_at TIMESTAMP NULL,
    manual_correction_reason VARCHAR(32) NULL,
    manual_correction_note VARCHAR(255) NULL,
    corrected_by BIGINT NULL,
    corrected_at TIMESTAMP NULL,
    evaluated_at TIMESTAMP NOT NULL,
    qualification_window_start DATE NULL,
    qualification_window_end DATE NULL,
    current_activity_status VARCHAR(32) NOT NULL DEFAULT 'NOT_ACTIVE',
    current_activity_window_start DATE NULL,
    current_activity_window_end DATE NULL,
    CONSTRAINT uk_local_effective_user_qualification UNIQUE (user_id, platform_code)
);

CREATE INDEX IF NOT EXISTS idx_local_effective_user_qualification
    ON effective_user_qualification_fact(user_id, qualification_status);

-- Local H2 does not run Flyway V73. Hibernate creates user profiles after SQL init,
-- so keep the local acceptance table without the production foreign key.
CREATE TABLE IF NOT EXISTS consumer_workspace_preference (
    user_id BIGINT NOT NULL PRIMARY KEY,
    platform_code VARCHAR(32) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Production creates these account tables in V66. The local profile skips Flyway,
-- but its client earnings page and release scheduler still query them.
CREATE TABLE IF NOT EXISTS invitation_reward_account (
    user_id BIGINT PRIMARY KEY,
    frozen_points DECIMAL(24,6) NOT NULL DEFAULT 0,
    available_points DECIMAL(24,6) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invitation_reward_entry (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    platform_code VARCHAR(32) NOT NULL,
    source_event_id VARCHAR(128) NOT NULL,
    reward_level INT NOT NULL,
    source_revision VARCHAR(512) NOT NULL,
    business_date DATE NOT NULL,
    occurred_at TIMESTAMP NOT NULL,
    source_user_id BIGINT NOT NULL,
    source_guild_id VARCHAR(64) NOT NULL,
    raw_diamonds DECIMAL(18,6) NOT NULL,
    company_share_rate DECIMAL(8,6) NOT NULL,
    company_income_diamonds DECIMAL(18,6) NOT NULL,
    invitation_rate DECIMAL(8,6) NOT NULL,
    reward_diamonds DECIMAL(18,6) NOT NULL,
    conversion_id BIGINT NOT NULL,
    points_per_diamond DECIMAL(18,6) NOT NULL,
    reward_points DECIMAL(24,6) NOT NULL,
    recorded_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_local_invitation_reward_source UNIQUE (platform_code, source_event_id, reward_level, user_id)
);

CREATE TABLE IF NOT EXISTS invitation_reward_release_lot (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entry_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    remaining_points DECIMAL(24,6) NOT NULL,
    unlock_at TIMESTAMP NOT NULL,
    released_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS invitation_reward_account_ledger (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    entry_id BIGINT NOT NULL,
    event_type VARCHAR(24) NOT NULL,
    frozen_delta DECIMAL(24,6) NOT NULL DEFAULT 0,
    available_delta DECIMAL(24,6) NOT NULL DEFAULT 0,
    reason VARCHAR(128) NOT NULL,
    platform_code VARCHAR(32) NOT NULL,
    source_event_id VARCHAR(128) NOT NULL,
    source_revision VARCHAR(512) NOT NULL,
    reward_level INT NOT NULL,
    source_user_id BIGINT NOT NULL,
    raw_diamonds DECIMAL(18,6) NOT NULL,
    company_share_rate DECIMAL(8,6) NOT NULL,
    company_income_diamonds DECIMAL(18,6) NOT NULL,
    invitation_rate DECIMAL(8,6) NOT NULL,
    reward_diamonds DECIMAL(18,6) NOT NULL,
    points_per_diamond DECIMAL(18,6) NOT NULL,
    conversion_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_local_invitation_reward_ledger_user
    ON invitation_reward_account_ledger(user_id, id);

-- Local acceptance skips Flyway, so mirror the V74 report projection tables.
CREATE TABLE IF NOT EXISTS invitation_commission_report_event (
    ledger_id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    platform_code VARCHAR(32) NOT NULL,
    report_date DATE NOT NULL,
    direct_invitee_user_id BIGINT NOT NULL,
    source_user_id BIGINT NOT NULL,
    reward_level INT NOT NULL,
    points_delta DECIMAL(24,6) NOT NULL,
    business_date DATE NULL,
    source_guild_id VARCHAR(64) NULL,
    occurred_at TIMESTAMP NULL
);

CREATE INDEX IF NOT EXISTS idx_local_commission_event_owner_day
    ON invitation_commission_report_event(user_id, platform_code, report_date);
CREATE INDEX IF NOT EXISTS idx_local_commission_ranking_scope
    ON invitation_commission_report_event(platform_code, business_date, source_guild_id, user_id);

CREATE TABLE IF NOT EXISTS invitation_commission_report_daily (
    user_id BIGINT NOT NULL,
    platform_code VARCHAR(32) NOT NULL,
    report_date DATE NOT NULL,
    direct_invitee_user_id BIGINT NOT NULL,
    source_user_id BIGINT NOT NULL,
    reward_level INT NOT NULL,
    points_delta DECIMAL(24,6) NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, platform_code, report_date, direct_invitee_user_id, source_user_id, reward_level)
);

CREATE INDEX IF NOT EXISTS idx_local_commission_daily_drill
    ON invitation_commission_report_daily(user_id, platform_code, direct_invitee_user_id, report_date);

-- Local acceptance disables Flyway. Mirror the JDBC-backed V76 user operations
-- tables here; production keeps the foreign keys and indexes in the migration.
CREATE TABLE IF NOT EXISTS user_operations_profile (
    user_id BIGINT PRIMARY KEY,
    operator_admin_id BIGINT NULL,
    value_code VARCHAR(24) NOT NULL DEFAULT 'GENERAL',
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_local_user_operations_operator
    ON user_operations_profile(operator_admin_id, user_id);
CREATE INDEX IF NOT EXISTS idx_local_user_operations_value
    ON user_operations_profile(value_code, user_id);

CREATE TABLE IF NOT EXISTS user_operations_profile_change (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    field_name VARCHAR(24) NOT NULL,
    old_operator_admin_id BIGINT NULL,
    new_operator_admin_id BIGINT NULL,
    old_value_code VARCHAR(24) NULL,
    new_value_code VARCHAR(24) NULL,
    changed_by_admin_id BIGINT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    changed_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_local_user_operations_change_history
    ON user_operations_profile_change(user_id, changed_at, id);
