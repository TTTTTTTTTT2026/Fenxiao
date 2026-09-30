CREATE TABLE user_password_credential (
    user_id BIGINT PRIMARY KEY,
    password_hash VARCHAR(256) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    failed_attempts INT NOT NULL DEFAULT 0,
    locked_until DATETIME NULL,
    password_changed_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);
