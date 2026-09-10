CREATE TABLE platform_verification_attempt (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    binding_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    platform_code VARCHAR(32) NOT NULL,
    platform_user_id VARCHAR(64) NOT NULL,
    source_system VARCHAR(64) NOT NULL,
    request_id VARCHAR(128),
    outcome VARCHAR(32) NOT NULL,
    error_code VARCHAR(96),
    retryable BOOLEAN NOT NULL DEFAULT FALSE,
    expected_guild_id VARCHAR(64),
    expected_country VARCHAR(64),
    official_guild_id VARCHAR(64),
    official_joined_at TIMESTAMP,
    snapshot_at VARCHAR(64),
    source_generation VARCHAR(128),
    checksum VARCHAR(160),
    source_reference VARCHAR(255),
    attempted_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_platform_verification_attempt_binding ON platform_verification_attempt(binding_id, attempted_at);
CREATE INDEX idx_platform_verification_attempt_request ON platform_verification_attempt(request_id);
