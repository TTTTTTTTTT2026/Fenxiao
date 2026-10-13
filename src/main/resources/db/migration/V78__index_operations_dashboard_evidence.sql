-- Dashboard reads are bounded by dates; earlier-success checks reuse the V77 user indexes.
-- No data backfill, new statistics table, triggers or reward processing.
CREATE INDEX idx_timo_verified_event_date
    ON platform_binding_history(platform_code, to_status, occurred_at, user_id, id);
CREATE INDEX idx_linky_verified_event_date
    ON linky_verification_attempt(result_status, membership_status, attempted_at, user_id, id);
