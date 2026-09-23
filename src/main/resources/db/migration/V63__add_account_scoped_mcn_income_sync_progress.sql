CREATE TABLE mcn_income_account_sync_checkpoint (
    checkpoint_key VARCHAR(112) PRIMARY KEY,
    platform_code VARCHAR(16) NOT NULL,
    platform_user_id VARCHAR(64) NOT NULL,
    next_cursor VARCHAR(2048),
    last_snapshot_at TIMESTAMP NULL,
    last_source_watermark LONGTEXT NULL,
    last_sync_status VARCHAR(32) NOT NULL,
    last_success_at TIMESTAMP NULL,
    next_attempt_at TIMESTAMP NULL,
    last_error_code VARCHAR(64),
    last_error_message VARCHAR(512),
    history_start DATE NULL,
    history_coverage_status VARCHAR(16) NOT NULL DEFAULT 'UNKNOWN',
    recovery_stage VARCHAR(32),
    recovery_from DATE,
    recovery_to DATE,
    recovery_window_end DATE,
    recovery_cursor VARCHAR(2048),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_mcn_income_account_sync_scope UNIQUE (platform_code, platform_user_id)
);

CREATE INDEX idx_mcn_income_account_sync_status
    ON mcn_income_account_sync_checkpoint(platform_code, last_sync_status, next_attempt_at);
