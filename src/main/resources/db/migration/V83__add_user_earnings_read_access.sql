-- Read permission only. No binding, qualification, reward or balance is created.
CREATE TABLE user_earnings_read_access (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    platform_code VARCHAR(32) NOT NULL,
    enabled BOOLEAN NOT NULL,
    version_no BIGINT NOT NULL,
    updated_by BIGINT NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_user_earnings_read_access UNIQUE (user_id, platform_code)
);
