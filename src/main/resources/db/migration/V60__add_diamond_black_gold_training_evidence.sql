-- Diamond and Black Gold have objective, simulated-time evidence gates.
-- The operator still records the business acceptance conclusion, but cannot bypass
-- trainee grade, uniqueness or complete-calendar-month requirements.
CREATE TABLE user_grade_advanced_training_evidence (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    advancement_review_id BIGINT NOT NULL,
    trainee_user_id BIGINT NOT NULL,
    scope_reference VARCHAR(128) NOT NULL,
    observation_start DATE NOT NULL,
    observation_end DATE NOT NULL,
    evidence_note VARCHAR(1000) NOT NULL,
    evidence_status VARCHAR(32) NOT NULL DEFAULT 'RECORDED',
    recorded_by BIGINT NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_by BIGINT NULL,
    confirmed_at TIMESTAMP NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_grade_advanced_evidence_trainee (advancement_review_id, trainee_user_id),
    UNIQUE KEY uk_grade_advanced_evidence_scope (advancement_review_id, scope_reference),
    INDEX idx_grade_advanced_evidence_review (advancement_review_id, evidence_status)
);
