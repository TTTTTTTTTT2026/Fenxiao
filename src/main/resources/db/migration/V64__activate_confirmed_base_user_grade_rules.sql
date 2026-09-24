-- The seven-grade catalogue is informational; these three base-grade rules make
-- the confirmed 3 / 10 / 30 cumulative direct-effective-user thresholds executable.
-- No paid-course, personal-income or team-profit requirement is introduced.
-- Keep the scope explicit so later country/platform-specific revisions remain versioned.
INSERT INTO user_grade_rule_version (
    rule_code, rule_version, grade_code, platform_code, country_code, guild_id,
    required_direct_invite_count, required_direct_income, effective_from,
    effective_to, rule_status, created_by, approved_by, approved_at, approval_note
)
SELECT CONCAT('UG-BASE-V1-', platforms.platform_code, '-', countries.country_code, '-', grades.grade_code),
       1, grades.grade_code, platforms.platform_code, countries.country_code, NULL,
       grades.required_count, 0.000000, CURRENT_TIMESTAMP,
       NULL, 'ACTIVE', NULL, NULL, CURRENT_TIMESTAMP,
       'Confirmed 3/10/30 direct-effective-user policy; version-controlled release'
FROM (
    SELECT 'TIMO' AS platform_code
    UNION ALL SELECT 'LINKY'
) platforms
CROSS JOIN (
    SELECT 'BR' AS country_code
    UNION ALL SELECT 'ID'
    UNION ALL SELECT 'MX'
) countries
CROSS JOIN (
    SELECT 'NEW_STAR' AS grade_code, 3 AS required_count
    UNION ALL SELECT 'SILVER', 10
    UNION ALL SELECT 'GOLD', 30
) grades
WHERE NOT EXISTS (
    SELECT 1 FROM user_grade_rule_version existing
    WHERE existing.platform_code = platforms.platform_code
      AND existing.country_code = countries.country_code
      AND existing.grade_code = grades.grade_code
      AND existing.guild_id IS NULL
      AND existing.rule_status = 'ACTIVE'
      AND existing.effective_from <= CURRENT_TIMESTAMP
      AND (existing.effective_to IS NULL OR existing.effective_to > CURRENT_TIMESTAMP)
);
