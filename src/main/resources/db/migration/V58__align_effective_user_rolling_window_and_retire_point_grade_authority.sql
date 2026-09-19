-- Effective-user qualification is earned from any completed rolling seven-day
-- business-date window containing at least three distinct settled INCOME dates.
-- Current activity is separately retained so normal inactivity never downgrades
-- an earned qualification or a user grade.
ALTER TABLE effective_user_qualification_fact
    ADD COLUMN qualification_window_start DATE NULL,
    ADD COLUMN qualification_window_end DATE NULL,
    ADD COLUMN current_activity_status VARCHAR(32) NOT NULL DEFAULT 'NOT_ACTIVE',
    ADD COLUMN current_activity_window_start DATE NULL,
    ADD COLUMN current_activity_window_end DATE NULL;

CREATE INDEX idx_effective_user_current_activity
    ON effective_user_qualification_fact (platform_code, current_activity_status, current_activity_window_end);

-- Point-based level versions are retained for audit only. The confirmed seven-grade
-- direct-effective-user mechanism is the sole authority for grade advancement.
UPDATE user_grade_level_version
SET rule_status='RETIRED',
    effective_to=COALESCE(effective_to, CURRENT_TIMESTAMP)
WHERE rule_status IN ('DRAFT', 'ACTIVE');
