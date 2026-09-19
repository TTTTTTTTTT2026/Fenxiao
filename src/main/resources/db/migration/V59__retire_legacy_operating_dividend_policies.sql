-- The former team-leader threshold and five-percent operating-dividend policy
-- must not be used by the confirmed grade/team model. Keep rows for audit, but
-- retire every mutable policy and legacy qualification.
UPDATE leadership_policy_version
SET enabled = FALSE,
    rule_status = 'RETIRED',
    effective_to = COALESCE(effective_to, CURRENT_TIMESTAMP)
WHERE enabled = TRUE
   OR rule_status IN ('DRAFT', 'ACTIVE');

UPDATE leadership_qualification
SET qualification_status = 'RETIRED',
    shadow_only = TRUE
WHERE qualification_code IN ('NEW_STAR_TEAM_LEADER', 'TEAM_PROFIT_SHARE')
  AND qualification_status IN ('IN_PROGRESS', 'QUALIFIED');
