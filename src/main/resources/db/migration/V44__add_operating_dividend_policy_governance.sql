ALTER TABLE leadership_policy_version
    ADD COLUMN rule_status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE leadership_policy_version
    ADD COLUMN created_by BIGINT NULL;

ALTER TABLE leadership_policy_version
    ADD COLUMN approved_by BIGINT NULL;

ALTER TABLE leadership_policy_version
    ADD COLUMN approved_at TIMESTAMP NULL;

ALTER TABLE leadership_policy_version
    ADD COLUMN approval_note VARCHAR(255) NULL;

UPDATE leadership_policy_version
SET rule_status = CASE WHEN enabled THEN 'ACTIVE' ELSE 'RETIRED' END
WHERE rule_status IS NULL OR rule_status = '';

CREATE INDEX idx_operating_dividend_policy_admin_list
    ON leadership_policy_version(rule_status, platform_code, country_code, effective_from);
