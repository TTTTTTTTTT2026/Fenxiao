CREATE TABLE platform_verification_mock (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    platform_code VARCHAR(32) NOT NULL,
    platform_user_id VARCHAR(64) NOT NULL,
    globally_seen_before_submission BOOLEAN NOT NULL,
    joined_target_guild BOOLEAN NOT NULL,
    official_guild_id VARCHAR(64) NOT NULL,
    official_joined_at DATETIME NOT NULL,
    source_reference VARCHAR(128) NULL,
    enabled BOOLEAN NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    UNIQUE KEY uk_platform_verification_mock_account (platform_code, platform_user_id),
    INDEX idx_platform_verification_mock_platform_enabled (platform_code, enabled)
);
