ALTER TABLE operating_team
    ADD COLUMN operating_profit_share_enabled BOOLEAN NOT NULL DEFAULT FALSE AFTER team_status;

CREATE INDEX idx_operating_team_profit_share_permission
    ON operating_team(team_status, operating_profit_share_enabled);
