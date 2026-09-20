-- The 2026-09-18 business decision keeps mentor cash incentives and team operating
-- rewards closed. Preserve their historical records, but ensure no previously
-- enabled shadow rule or per-team permission can look like an approved program.

update incentive_rule_version
set enabled = false,
    rule_status = 'RETIRED',
    effective_to = coalesce(effective_to, current_timestamp)
where reward_type = 'MENTOR'
  and (enabled = true or rule_status = 'ACTIVE');

update operating_team
set operating_profit_share_enabled = false,
    updated_at = current_timestamp
where operating_profit_share_enabled = true;
