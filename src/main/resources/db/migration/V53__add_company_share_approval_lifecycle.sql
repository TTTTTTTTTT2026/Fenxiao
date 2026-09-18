-- A company-share change is a business-rule version. Only ACTIVE rows may be used as calculation evidence.
ALTER TABLE platform_guild_company_share_version
    ADD COLUMN share_version INT NOT NULL DEFAULT 1 AFTER guild_id,
    ADD COLUMN rule_status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE' AFTER effective_to,
    ADD COLUMN approved_by BIGINT NULL AFTER configured_by,
    ADD COLUMN approved_at TIMESTAMP NULL AFTER approved_by,
    ADD COLUMN approval_note VARCHAR(255) NULL AFTER approved_at;

CREATE INDEX idx_guild_company_share_rule_status
    ON platform_guild_company_share_version(platform_code, guild_id, rule_status, effective_from);
