ALTER TABLE operating_team
    ADD COLUMN leader_qualification_status VARCHAR(32) NOT NULL DEFAULT 'NOT_APPLICABLE',
    ADD COLUMN team_establishment_status VARCHAR(32) NOT NULL DEFAULT 'LEGACY_UNVERIFIED',
    ADD COLUMN leader_appointment_status VARCHAR(32) NOT NULL DEFAULT 'NOT_APPLICABLE',
    ADD COLUMN leadership_source VARCHAR(64) NULL,
    ADD COLUMN leader_appointed_at DATETIME NULL;

UPDATE operating_team
SET leader_qualification_status = CASE WHEN leader_user_id IS NULL THEN 'NOT_APPLICABLE' ELSE 'LEGACY_UNVERIFIED' END,
    team_establishment_status = CASE WHEN leader_user_id IS NULL THEN 'SYSTEM_HOLDING' ELSE 'LEGACY_UNVERIFIED' END,
    leader_appointment_status = CASE WHEN leader_user_id IS NULL THEN 'NOT_APPLICABLE' ELSE 'LEGACY_UNVERIFIED' END,
    leadership_source = CASE WHEN leader_user_id IS NULL THEN 'SYSTEM_HOLDING' ELSE 'LEGACY_DIRECT_ROLE' END;

CREATE INDEX idx_operating_team_leadership_status
    ON operating_team (leader_appointment_status, team_status);
