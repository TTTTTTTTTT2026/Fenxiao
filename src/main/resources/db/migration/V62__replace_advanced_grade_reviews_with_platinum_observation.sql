-- Platinum is the only active high-grade path. The review stores a 30-day
-- observation window; member progress is derived from invitation and income facts.
ALTER TABLE user_grade_advancement_review
    ADD COLUMN observation_start DATE NULL,
    ADD COLUMN observation_end DATE NULL,
    ADD COLUMN eligible_silver_member_count INT NOT NULL DEFAULT 0,
    ADD COLUMN passed_silver_member_count INT NOT NULL DEFAULT 0,
    ADD COLUMN required_silver_member_count INT NOT NULL DEFAULT 2,
    ADD COLUMN promotion_confirmed_by BIGINT NULL,
    ADD COLUMN promotion_confirmed_at TIMESTAMP NULL,
    ADD COLUMN promotion_note VARCHAR(512) NULL,
    ADD COLUMN failure_note VARCHAR(512) NULL;

-- Old multi-step evidence records are retained for audit, but are no longer used
-- by the active workflow. Historical non-Platinum rows are not surfaced as active.
UPDATE user_grade_advancement_review
SET observation_start = DATE(created_at),
    observation_end = DATE_ADD(DATE(created_at), INTERVAL 29 DAY),
    review_status = CASE WHEN review_status = 'LEADER_CONFIRMED' THEN 'PASSED' ELSE 'EXPIRED' END
WHERE observation_start IS NULL;

CREATE INDEX idx_grade_advancement_observation_status
    ON user_grade_advancement_review (target_grade_code, review_status, observation_end);
