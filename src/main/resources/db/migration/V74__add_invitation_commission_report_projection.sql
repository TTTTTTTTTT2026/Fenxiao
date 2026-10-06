-- One immutable projection row per accounting event makes the daily rollup idempotent.
-- The source of truth remains invitation_reward_account_ledger; report reads never scan it.
CREATE TABLE invitation_commission_report_event (
    ledger_id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    platform_code VARCHAR(32) NOT NULL,
    report_date DATE NOT NULL,
    direct_invitee_user_id BIGINT NOT NULL,
    source_user_id BIGINT NOT NULL,
    reward_level INT NOT NULL,
    points_delta DECIMAL(24,6) NOT NULL,
    INDEX idx_commission_event_owner_day (user_id, platform_code, report_date),
    CONSTRAINT fk_commission_report_ledger FOREIGN KEY (ledger_id) REFERENCES invitation_reward_account_ledger(id)
);

CREATE TABLE invitation_commission_report_daily (
    user_id BIGINT NOT NULL,
    platform_code VARCHAR(32) NOT NULL,
    report_date DATE NOT NULL,
    direct_invitee_user_id BIGINT NOT NULL,
    source_user_id BIGINT NOT NULL,
    reward_level INT NOT NULL,
    points_delta DECIMAL(24,6) NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, platform_code, report_date, direct_invitee_user_id, source_user_id, reward_level),
    INDEX idx_commission_daily_drill (user_id, platform_code, direct_invitee_user_id, report_date)
);

-- One-time migration of existing account events. 0 is a visible unresolved-route bucket;
-- never silently assign historical level-2 income to a guessed current inviter.
INSERT INTO invitation_commission_report_event
    (ledger_id,user_id,platform_code,report_date,direct_invitee_user_id,source_user_id,reward_level,points_delta)
SELECT l.id,l.user_id,l.platform_code,DATE(l.created_at),
       CASE WHEN l.reward_level=1 THEN l.source_user_id ELSE COALESCE((
           SELECT r.inviter_user_id FROM invitation_relation_version r
           WHERE r.user_id=l.source_user_id AND r.effective_from<=e.occurred_at
             AND (r.effective_to IS NULL OR r.effective_to>e.occurred_at)
           ORDER BY r.version_no DESC LIMIT 1
       ),0) END,
       l.source_user_id,l.reward_level,l.frozen_delta+l.available_delta
FROM invitation_reward_account_ledger l
JOIN invitation_reward_entry e ON e.id=l.entry_id
WHERE l.reward_level IN (1,2) AND l.event_type IN ('INVITATION_REWARD','MCN_INCREASE','MCN_REVISION');

INSERT INTO invitation_commission_report_daily
    (user_id,platform_code,report_date,direct_invitee_user_id,source_user_id,reward_level,points_delta)
SELECT user_id,platform_code,report_date,direct_invitee_user_id,source_user_id,reward_level,SUM(points_delta)
FROM invitation_commission_report_event
GROUP BY user_id,platform_code,report_date,direct_invitee_user_id,source_user_id,reward_level;
