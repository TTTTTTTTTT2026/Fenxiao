CREATE TABLE user_linky_binding_target_override (
  user_id BIGINT PRIMARY KEY,
  linky_account VARCHAR(8) NOT NULL,
  guild_id VARCHAR(8) NOT NULL,
  guild_name VARCHAR(128) NOT NULL,
  guild_invite_code VARCHAR(128) NOT NULL,
  change_reason VARCHAR(255) NOT NULL,
  changed_by BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
