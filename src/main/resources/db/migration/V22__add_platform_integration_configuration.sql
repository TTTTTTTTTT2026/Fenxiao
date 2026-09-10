CREATE TABLE platform_integration_config (
    platform_code VARCHAR(32) PRIMARY KEY,
    display_name VARCHAR(64) NOT NULL,
    primary_account_identifier VARCHAR(64) NOT NULL,
    account_identifier_note VARCHAR(255) NOT NULL,
    mcn_integration_status VARCHAR(32) NOT NULL,
    revenue_ingestion_mode VARCHAR(32) NOT NULL,
    reward_mode VARCHAR(32) NOT NULL,
    enabled BOOLEAN NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);

CREATE TABLE platform_target_guild (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    platform_code VARCHAR(32) NOT NULL,
    country_code VARCHAR(10) NOT NULL,
    official_guild_id VARCHAR(64) NOT NULL,
    official_guild_sid VARCHAR(64) NULL,
    guild_name VARCHAR(128) NOT NULL,
    enabled BOOLEAN NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    UNIQUE KEY uk_platform_target_guild (platform_code, country_code, official_guild_id),
    INDEX idx_platform_target_guild_platform (platform_code, enabled)
);

INSERT INTO platform_integration_config
    (platform_code, display_name, primary_account_identifier, account_identifier_note, mcn_integration_status, revenue_ingestion_mode, reward_mode, enabled, created_at, updated_at)
VALUES
    ('LINKY', 'Linky', 'sid', '已确认 sid 与现有 linky_account 是同一个平台主账号标识。', 'LEGACY_ONLY', 'LEGACY_EVENT', 'LEGACY_RULES', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('TIMO', 'Timo', 'timo_id', '使用 MCN 返回的 timo_id；不得以昵称、WhatsApp 或邀请码匹配。', 'CREDENTIAL_PENDING', 'DAILY_SNAPSHOT', 'SHADOW_ONLY', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO platform_target_guild
    (platform_code, country_code, official_guild_id, official_guild_sid, guild_name, enabled, created_at, updated_at)
VALUES
    ('TIMO', 'MX', '22000408', NULL, 'Royal Latam', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('TIMO', 'ID', '11003905', NULL, 'Royal ID', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('TIMO', 'BR', '22000448', NULL, 'Royal BR', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
