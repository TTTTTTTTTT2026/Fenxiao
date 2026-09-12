CREATE TABLE mcn_income_delivery_receipt (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    source_system VARCHAR(32) NOT NULL,
    delivery_id VARCHAR(128) NOT NULL,
    payload_hash VARCHAR(64) NOT NULL,
    fact_count INT NOT NULL,
    accepted_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_mcn_income_delivery UNIQUE (source_system, delivery_id)
);

CREATE TABLE mcn_income_raw_ledger_event (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    source_system VARCHAR(32) NOT NULL,
    delivery_id VARCHAR(128) NOT NULL,
    platform_code VARCHAR(32) NOT NULL,
    source_event_id VARCHAR(128) NOT NULL,
    source_revision VARCHAR(64) NOT NULL,
    original_source_event_id VARCHAR(128),
    platform_user_id VARCHAR(64) NOT NULL,
    resolved_user_id BIGINT,
    resolution_status VARCHAR(32) NOT NULL,
    resolution_reason VARCHAR(96) NOT NULL,
    event_type VARCHAR(32) NOT NULL,
    settlement_status VARCHAR(32) NOT NULL,
    amount DECIMAL(18,6) NOT NULL,
    currency_code VARCHAR(16) NOT NULL,
    occurred_at TIMESTAMP NOT NULL,
    settled_at TIMESTAMP,
    source_updated_at TIMESTAMP NOT NULL,
    guild_id VARCHAR(64),
    payload_hash VARCHAR(64) NOT NULL,
    source_payload LONGTEXT NOT NULL,
    received_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_mcn_income_fact_revision UNIQUE (source_system, platform_code, source_event_id, source_revision)
);

CREATE INDEX idx_mcn_income_raw_resolution ON mcn_income_raw_ledger_event(resolution_status, platform_code, received_at);
CREATE INDEX idx_mcn_income_raw_account ON mcn_income_raw_ledger_event(platform_code, platform_user_id, occurred_at);
