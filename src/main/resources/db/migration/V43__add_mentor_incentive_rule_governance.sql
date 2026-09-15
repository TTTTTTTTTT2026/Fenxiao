ALTER TABLE incentive_rule_version
    ADD COLUMN rule_status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE incentive_rule_version
    ADD COLUMN created_by BIGINT NULL;

ALTER TABLE incentive_rule_version
    ADD COLUMN approved_by BIGINT NULL;

ALTER TABLE incentive_rule_version
    ADD COLUMN approved_at TIMESTAMP NULL;

ALTER TABLE incentive_rule_version
    ADD COLUMN approval_note VARCHAR(255) NULL;

UPDATE incentive_rule_version
SET rule_status = CASE WHEN enabled THEN 'ACTIVE' ELSE 'RETIRED' END
WHERE rule_status IS NULL OR rule_status = '';

CREATE INDEX idx_incentive_rule_admin_list
    ON incentive_rule_version(reward_type, rule_status, effective_from);
