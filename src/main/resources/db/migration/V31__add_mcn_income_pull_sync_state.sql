CREATE TABLE mcn_income_sync_checkpoint (
    platform_code VARCHAR(32) PRIMARY KEY,
    next_cursor VARCHAR(1024),
    last_snapshot_at TIMESTAMP NULL,
    last_source_watermark LONGTEXT NULL,
    last_sync_status VARCHAR(32) NOT NULL,
    last_success_at TIMESTAMP NULL,
    last_error_code VARCHAR(64),
    last_error_message VARCHAR(512),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE mcn_income_sync_run (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    run_id VARCHAR(64) NOT NULL,
    platform_code VARCHAR(32) NOT NULL,
    requested_cursor VARCHAR(1024),
    delivery_id VARCHAR(128),
    request_id VARCHAR(128),
    sync_status VARCHAR(32) NOT NULL,
    received_count INT NOT NULL DEFAULT 0,
    new_count INT NOT NULL DEFAULT 0,
    duplicate_count INT NOT NULL DEFAULT 0,
    unmatched_count INT NOT NULL DEFAULT 0,
    snapshot_at TIMESTAMP NULL,
    source_watermark LONGTEXT NULL,
    retry_after_seconds INT NULL,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP NOT NULL,
    error_code VARCHAR(64),
    error_message VARCHAR(512),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_mcn_income_sync_run UNIQUE (run_id)
);

CREATE INDEX idx_mcn_income_sync_run_platform_time
    ON mcn_income_sync_run(platform_code, started_at);
