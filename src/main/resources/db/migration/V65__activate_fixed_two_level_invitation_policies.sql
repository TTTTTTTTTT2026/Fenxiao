-- User-confirmed internal-test policy: company business income x direct 10% / indirect 3%.
-- This configures non-payable candidate calculations only. Reward and finance switches stay off.
-- The production MySQL session uses UTC; activation begins at this migration's execution time.
-- Freeze days are zero only because payout is disabled and no payout timing has been agreed.
INSERT INTO commission_policy (
    policy_code, commission_type, platform_code, country_code, role_code,
    max_reward_level, level1_enabled, level1_rate, level1_freeze_days,
    level2_enabled, level2_rate, level2_freeze_days,
    level3_enabled, level3_rate, level3_freeze_days,
    effective_from, effective_to, status, created_by, approved_by, approved_at, approval_note
)
SELECT CONCAT('CP-INV-V2-', platforms.platform_code, '-', countries.country_code),
       'INVITATION', platforms.platform_code, countries.country_code, 'ALL',
       2, TRUE, 0.100000, 0,
       TRUE, 0.030000, 0,
       FALSE, NULL, NULL,
       CURRENT_TIMESTAMP, NULL, 'ACTIVE', 0, 0, CURRENT_TIMESTAMP,
       'User-confirmed 10/3 internal-test calculation; payout remains disabled'
FROM (
    SELECT 'TIMO' AS platform_code
    UNION ALL SELECT 'LINKY'
) platforms
CROSS JOIN (
    SELECT 'BR' AS country_code
    UNION ALL SELECT 'ID'
    UNION ALL SELECT 'MX'
) countries
WHERE NOT EXISTS (
    SELECT 1 FROM commission_policy existing
    WHERE existing.commission_type = 'INVITATION'
      AND existing.platform_code = platforms.platform_code
      AND existing.country_code = countries.country_code
      AND existing.status = 'ACTIVE'
      AND (existing.effective_to IS NULL OR existing.effective_to >= CURRENT_TIMESTAMP)
)
AND NOT EXISTS (
    SELECT 1 FROM commission_policy existing
    WHERE existing.policy_code = CONCAT('CP-INV-V2-', platforms.platform_code, '-', countries.country_code)
);
