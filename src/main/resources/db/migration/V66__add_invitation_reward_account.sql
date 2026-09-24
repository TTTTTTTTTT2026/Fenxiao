CREATE TABLE invitation_reward_account (
    user_id BIGINT PRIMARY KEY,
    frozen_points DECIMAL(24,6) NOT NULL DEFAULT 0,
    available_points DECIMAL(24,6) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invitation_reward_entry (
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
    UNIQUE KEY uk_invitation_reward_source (platform_code, source_event_id, reward_level, user_id),
    INDEX idx_invitation_reward_user (user_id, id),
    INDEX idx_invitation_reward_date (platform_code, business_date),
    CONSTRAINT fk_invitation_reward_conversion FOREIGN KEY (conversion_id) REFERENCES token_point_conversion_version(id)
);

CREATE TABLE invitation_reward_release_lot (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entry_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    remaining_points DECIMAL(24,6) NOT NULL,
    unlock_at TIMESTAMP NOT NULL,
    released_at TIMESTAMP NULL,
    INDEX idx_invitation_reward_due (released_at, unlock_at),
    INDEX idx_invitation_reward_lot_entry (entry_id, released_at),
    CONSTRAINT fk_invitation_reward_lot_entry FOREIGN KEY (entry_id) REFERENCES invitation_reward_entry(id)
);

CREATE TABLE invitation_reward_account_ledger (
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
    created_at TIMESTAMP NOT NULL,
    INDEX idx_invitation_reward_ledger_user (user_id, id),
    INDEX idx_invitation_reward_ledger_entry (entry_id, id),
    CONSTRAINT fk_invitation_reward_ledger_entry FOREIGN KEY (entry_id) REFERENCES invitation_reward_entry(id)
);
