ALTER TABLE platform_target_guild
    ADD COLUMN operating_share_rate DECIMAL(8,6) NULL;

CREATE INDEX idx_platform_target_guild_platform_guild
    ON platform_target_guild(platform_code, official_guild_id);
