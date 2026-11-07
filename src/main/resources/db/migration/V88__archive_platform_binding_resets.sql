CREATE TABLE platform_binding_reset_archive (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    platform_code VARCHAR(32) NOT NULL,
    binding_id BIGINT NOT NULL,
    platform_user_id VARCHAR(64) NOT NULL,
    previously_verified BOOLEAN NOT NULL,
    snapshot_data LONGTEXT NOT NULL,
    reset_at TIMESTAMP NOT NULL,
    INDEX idx_binding_reset_account (platform_code, platform_user_id),
    INDEX idx_binding_reset_user (user_id, platform_code)
);
