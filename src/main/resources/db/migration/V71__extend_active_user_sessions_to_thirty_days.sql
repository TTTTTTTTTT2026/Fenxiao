-- Extend only sessions that are still valid at deployment. Never revive expired or revoked tokens.
UPDATE user_session
SET expires_at = TIMESTAMPADD(DAY, 30, created_at)
WHERE revoked_at IS NULL
  AND expires_at > UTC_TIMESTAMP()
  AND expires_at < TIMESTAMPADD(DAY, 30, created_at);
