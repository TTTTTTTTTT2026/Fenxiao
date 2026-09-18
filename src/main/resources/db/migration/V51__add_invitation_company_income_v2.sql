-- V2 invitation calculation is deliberately separate from the legacy candidate projection.
-- It snapshots the source guild company-share rate at the income occurrence time.
CREATE TABLE platform_guild_company_share_version (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    platform_code VARCHAR(32) NOT NULL,
    guild_id VARCHAR(64) NOT NULL,
    share_rate DECIMAL(8,6) NOT NULL,
    effective_from TIMESTAMP NOT NULL,
    effective_to TIMESTAMP NULL,
    configured_by BIGINT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_guild_company_share_effective (platform_code, guild_id, effective_from)
);

-- Existing mutable catalogue values are retained only as the initial historical baseline.
INSERT INTO platform_guild_company_share_version(platform_code,guild_id,share_rate,effective_from)
SELECT platform_code,official_guild_id,operating_share_rate,'1970-01-01 00:00:00'
FROM platform_target_guild
WHERE operating_share_rate IS NOT NULL;

ALTER TABLE mcn_income_reward_candidate_projection
    ADD COLUMN calculation_version VARCHAR(32) NOT NULL DEFAULT 'LEGACY_V1' AFTER source_revision,
    ADD COLUMN source_guild_id VARCHAR(64) NULL AFTER source_user_id,
    ADD COLUMN company_share_rate DECIMAL(8,6) NULL AFTER rule_rate,
    ADD COLUMN company_income_base_amount DECIMAL(18,6) NULL AFTER base_amount;

ALTER TABLE mcn_income_reward_candidate_run_item
    ADD COLUMN calculation_version VARCHAR(32) NOT NULL DEFAULT 'LEGACY_V1' AFTER source_revision,
    ADD COLUMN source_guild_id VARCHAR(64) NULL AFTER source_user_id,
    ADD COLUMN company_share_rate DECIMAL(8,6) NULL AFTER rule_rate,
    ADD COLUMN company_income_base_amount DECIMAL(18,6) NULL AFTER base_amount;

CREATE TABLE mcn_income_team_reward_reserve_fact (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    source_system VARCHAR(32) NOT NULL,
    platform_code VARCHAR(32) NOT NULL,
    source_event_id VARCHAR(128) NOT NULL,
    source_revision VARCHAR(512) NOT NULL,
    business_date DATE NOT NULL,
    occurred_at TIMESTAMP NOT NULL,
    source_user_id BIGINT NOT NULL,
    source_guild_id VARCHAR(64) NOT NULL,
    company_share_rate DECIMAL(8,6) NOT NULL,
    company_income_base_amount DECIMAL(18,6) NOT NULL,
    reserve_rate DECIMAL(8,6) NOT NULL,
    reserve_amount DECIMAL(18,6) NOT NULL,
    currency_code VARCHAR(16) NOT NULL,
    amount_unit VARCHAR(32) NOT NULL,
    reserve_status VARCHAR(32) NOT NULL,
    decision_reason VARCHAR(128) NOT NULL,
    projected_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_mcn_income_team_reward_reserve UNIQUE (source_system, platform_code, source_event_id),
    INDEX idx_mcn_income_team_reserve_day (platform_code, business_date, reserve_status)
);
