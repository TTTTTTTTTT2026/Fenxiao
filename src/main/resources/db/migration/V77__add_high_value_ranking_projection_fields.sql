-- Enrich the existing immutable commission read projection. Ranking reads never scan
-- the accounting ledger; this one-time backfill resolves its original event scope.
ALTER TABLE invitation_commission_report_event
    ADD COLUMN business_date DATE NULL,
    ADD COLUMN source_guild_id VARCHAR(64) NULL,
    ADD COLUMN occurred_at TIMESTAMP NULL;

UPDATE invitation_commission_report_event p
JOIN invitation_reward_account_ledger l ON l.id = p.ledger_id
JOIN invitation_reward_entry e ON e.id = l.entry_id
SET p.business_date = e.business_date,
    p.source_guild_id = e.source_guild_id,
    p.occurred_at = e.occurred_at;

CREATE INDEX idx_commission_ranking_scope
    ON invitation_commission_report_event(platform_code, business_date, source_guild_id, user_id);
CREATE INDEX idx_mcn_shadow_ranking_scope
    ON mcn_income_shadow_ledger_projection(platform_code, business_date, shadow_status, resolved_user_id);
CREATE INDEX idx_linky_verification_first_success
    ON linky_verification_attempt(user_id, result_status, attempted_at, id);
CREATE INDEX idx_platform_history_first_verified
    ON platform_binding_history(platform_code, user_id, to_status, occurred_at, id);
CREATE INDEX idx_operations_value_asof
    ON user_operations_profile_change(user_id, field_name, changed_at, id);
