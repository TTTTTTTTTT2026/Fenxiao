CREATE TABLE invitation_verification_campaign (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  platform_code VARCHAR(32) NOT NULL,
  reward_points DECIMAL(18,6) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_by BIGINT NOT NULL,
  updated_by BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_verification_campaign_platform_enabled ON invitation_verification_campaign(platform_code, enabled);

CREATE TABLE invitation_verification_campaign_award (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  campaign_id BIGINT NOT NULL,
  invited_user_id BIGINT NOT NULL,
  inviter_user_id BIGINT NOT NULL,
  platform_code VARCHAR(32) NOT NULL,
  reward_points DECIMAL(18,6) NOT NULL,
  verified_at TIMESTAMP NOT NULL,
  awarded_at TIMESTAMP NULL,
  unlock_at TIMESTAMP NULL,
  released_at TIMESTAMP NULL,
  CONSTRAINT uk_campaign_invitee_platform UNIQUE (campaign_id, invited_user_id, platform_code)
);
CREATE INDEX idx_verification_award_processing ON invitation_verification_campaign_award(awarded_at, id);
CREATE INDEX idx_verification_award_release ON invitation_verification_campaign_award(released_at, unlock_at);
CREATE INDEX idx_verification_award_user ON invitation_verification_campaign_award(inviter_user_id, platform_code, id);
CREATE UNIQUE INDEX uk_verification_campaign_platform ON invitation_verification_campaign(platform_code);
INSERT INTO invitation_verification_campaign(name,platform_code,reward_points,enabled,created_by,updated_by,created_at,updated_at)
VALUES ('Timo 邀请核验奖励','TIMO',0,FALSE,0,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
       ('Linky 邀请核验奖励','LINKY',0,FALSE,0,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
