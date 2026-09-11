CREATE TABLE linky_invitation_guild_attribution (
    user_id BIGINT PRIMARY KEY,
    guild_id VARCHAR(64) NOT NULL,
    guild_name VARCHAR(128) NOT NULL,
    guild_invite_code VARCHAR(64),
    attribution_source VARCHAR(32) NOT NULL,
    inherited_from_user_id BIGINT,
    effective_at TIMESTAMP NOT NULL,
    changed_by BIGINT,
    change_reason VARCHAR(255),
    version_no INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_linky_invitation_guild_source
    ON linky_invitation_guild_attribution (attribution_source, guild_id);

ALTER TABLE linky_account_binding
    ADD COLUMN expected_guild_source VARCHAR(32);
