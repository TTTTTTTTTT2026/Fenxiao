CREATE TABLE linky_verification_attempt (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    linky_account VARCHAR(32) NOT NULL,
    expected_guild_id VARCHAR(64) NOT NULL,
    verification_source VARCHAR(16) NOT NULL,
    result_status VARCHAR(32) NOT NULL,
    membership_status VARCHAR(64),
    observed_guild_id VARCHAR(64),
    request_id VARCHAR(64),
    snapshot_at VARCHAR(64),
    source_generation VARCHAR(128),
    checksum VARCHAR(128),
    error_code VARCHAR(128),
    retryable BOOLEAN NOT NULL DEFAULT FALSE,
    attempted_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_linky_verification_attempt_account
    ON linky_verification_attempt (linky_account, id);
