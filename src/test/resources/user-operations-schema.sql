CREATE TABLE user_operations_profile (
    user_id BIGINT PRIMARY KEY,
    operator_admin_id BIGINT NULL,
    value_code VARCHAR(24) NOT NULL DEFAULT 'GENERAL',
    updated_at TIMESTAMP NOT NULL
);
CREATE TABLE user_operations_profile_change (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    field_name VARCHAR(24) NOT NULL,
    old_operator_admin_id BIGINT NULL,
    new_operator_admin_id BIGINT NULL,
    old_value_code VARCHAR(24) NULL,
    new_value_code VARCHAR(24) NULL,
    changed_by_admin_id BIGINT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    changed_at TIMESTAMP NOT NULL
);
