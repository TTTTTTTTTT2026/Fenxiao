-- Point accrual is a local, auditable read model.  It never creates rewards,
-- wallet balances, withdrawals or payments.
CREATE TABLE user_direct_invitee_point_fact (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    source_system VARCHAR(32) NOT NULL,
    platform_code VARCHAR(32) NOT NULL,
    source_event_id VARCHAR(128) NOT NULL,
    raw_ledger_event_id BIGINT NOT NULL,
    source_revision VARCHAR(512) NOT NULL,
    source_user_id BIGINT NOT NULL,
    beneficiary_user_id BIGINT NULL,
    invitation_version_no INT NULL,
    conversion_id BIGINT NULL,
    token_unit VARCHAR(32) NOT NULL,
    source_amount DECIMAL(18,6) NOT NULL,
    points_per_token DECIMAL(18,6) NULL,
    point_amount DECIMAL(18,6) NULL,
    occurred_at TIMESTAMP NOT NULL,
    fact_status VARCHAR(32) NOT NULL,
    decision_reason VARCHAR(255) NOT NULL,
    projected_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_direct_invitee_point_fact (source_system, platform_code, source_event_id),
    INDEX idx_user_direct_invitee_point_beneficiary (beneficiary_user_id, fact_status, occurred_at),
    INDEX idx_user_direct_invitee_point_source (source_user_id, platform_code, fact_status)
);

CREATE TABLE user_point_balance_projection (
    user_id BIGINT PRIMARY KEY,
    total_points DECIMAL(18,6) NOT NULL DEFAULT 0,
    accrued_fact_count INT NOT NULL DEFAULT 0,
    latest_income_at TIMESTAMP NULL,
    evaluated_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_point_balance_total (total_points DESC)
);
