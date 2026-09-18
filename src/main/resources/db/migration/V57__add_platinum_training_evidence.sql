-- Platinum advancement needs two independently auditable cultivation and group-operation records.
-- These are evidence records only; they neither promote a user nor enable any reward program.
CREATE TABLE user_grade_platinum_training_evidence (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    advancement_review_id BIGINT NOT NULL,
    trainee_user_id BIGINT NOT NULL,
    group_reference VARCHAR(128) NOT NULL,
    observation_start DATE NOT NULL,
    observation_end DATE NOT NULL,
    final_week_effective_user_count INT NOT NULL,
    final_week_min_income_date_count INT NOT NULL,
    evidence_note VARCHAR(1000) NOT NULL,
    evidence_status VARCHAR(32) NOT NULL DEFAULT 'RECORDED',
    recorded_by BIGINT NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_by BIGINT NULL,
    confirmed_at TIMESTAMP NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_grade_platinum_evidence_trainee (advancement_review_id, trainee_user_id),
    UNIQUE KEY uk_grade_platinum_evidence_group (advancement_review_id, group_reference),
    INDEX idx_grade_platinum_evidence_review (advancement_review_id, evidence_status)
);
