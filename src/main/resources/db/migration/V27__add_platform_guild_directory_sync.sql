CREATE TABLE platform_guild_directory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    platform_code VARCHAR(32) NOT NULL,
    external_guild_id VARCHAR(64) NOT NULL,
    guild_name VARCHAR(128) NOT NULL,
    guild_status VARCHAR(32) NOT NULL,
    directory_status VARCHAR(32) NOT NULL,
    official_updated_at TIMESTAMP NULL,
    last_seen_at TIMESTAMP NOT NULL,
    last_sync_run_id VARCHAR(64) NOT NULL,
    source_version VARCHAR(128),
    join_instruction VARCHAR(255),
    missing_since TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_platform_guild_directory UNIQUE (platform_code, external_guild_id)
);

CREATE INDEX idx_platform_guild_directory_status
    ON platform_guild_directory (platform_code, directory_status, guild_status);

CREATE TABLE platform_guild_sync_run (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    run_id VARCHAR(64) NOT NULL,
    platform_code VARCHAR(32) NOT NULL,
    sync_status VARCHAR(32) NOT NULL,
    snapshot_complete BOOLEAN NOT NULL,
    received_count INT NOT NULL DEFAULT 0,
    upserted_count INT NOT NULL DEFAULT 0,
    missing_count INT NOT NULL DEFAULT 0,
    source_version VARCHAR(128),
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP NULL,
    error_code VARCHAR(128),
    error_message VARCHAR(512),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_platform_guild_sync_run UNIQUE (run_id, platform_code)
);

CREATE INDEX idx_platform_guild_sync_run_platform_started
    ON platform_guild_sync_run (platform_code, started_at);
