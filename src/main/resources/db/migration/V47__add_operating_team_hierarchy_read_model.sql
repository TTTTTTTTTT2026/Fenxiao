ALTER TABLE operating_team
    ADD COLUMN parent_team_id BIGINT NULL;

CREATE INDEX idx_operating_team_parent ON operating_team(parent_team_id);

CREATE TABLE operating_team_member_relation (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    team_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    member_role VARCHAR(32) NOT NULL,
    effective_from TIMESTAMP NOT NULL,
    effective_to TIMESTAMP NULL,
    source_type VARCHAR(32) NOT NULL,
    source_reference VARCHAR(128) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_operating_team_member_relation (team_id, user_id, effective_from),
    INDEX idx_operating_team_member_active (team_id, effective_to),
    INDEX idx_operating_team_member_user_active (user_id, effective_to)
);

-- Existing exclusive membership records are retained unchanged and become the initial
-- additive team membership read model. New grade-driven teams can add a membership
-- without ending the member's historical parent-team membership.
INSERT INTO operating_team_member_relation (
    team_id, user_id, member_role, effective_from, effective_to, source_type, source_reference, created_at, updated_at
)
SELECT team_id, user_id, 'MEMBER', effective_from, effective_to, source_type, source_reference, created_at, updated_at
FROM team_membership_version;

INSERT INTO operating_team_member_relation (
    team_id, user_id, member_role, effective_from, effective_to, source_type, source_reference, created_at, updated_at
)
SELECT t.id, t.leader_user_id, 'LEADER', t.created_at, NULL, 'LEGACY_TEAM_LEADER', t.team_code, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM operating_team t
WHERE t.leader_user_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM operating_team_member_relation r
      WHERE r.team_id=t.id AND r.user_id=t.leader_user_id AND r.effective_to IS NULL
  );
