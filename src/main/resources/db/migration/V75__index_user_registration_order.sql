CREATE INDEX idx_user_profile_registered_at_user_id
    ON user_distribution_profile (registered_at, user_id);
