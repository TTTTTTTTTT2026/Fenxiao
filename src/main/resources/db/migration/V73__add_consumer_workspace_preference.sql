CREATE TABLE consumer_workspace_preference (
    user_id BIGINT NOT NULL PRIMARY KEY,
    platform_code VARCHAR(32) NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_consumer_workspace_user FOREIGN KEY (user_id) REFERENCES user_distribution_profile(user_id)
);
