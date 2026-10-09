-- Current assignment and value are global to a user. Missing rows mean unassigned / GENERAL.
CREATE TABLE user_operations_profile (
    user_id BIGINT PRIMARY KEY,
    operator_admin_id BIGINT NULL,
    value_code VARCHAR(24) NOT NULL DEFAULT 'GENERAL',
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_user_operations_profile_user FOREIGN KEY (user_id) REFERENCES user_distribution_profile(user_id),
    CONSTRAINT fk_user_operations_profile_operator FOREIGN KEY (operator_admin_id) REFERENCES admin_account(id),
    CONSTRAINT ck_user_operations_profile_value CHECK (value_code IN ('GENERAL', 'HIGH_VALUE'))
);
CREATE INDEX idx_user_operations_profile_operator ON user_operations_profile(operator_admin_id, user_id);
CREATE INDEX idx_user_operations_profile_value ON user_operations_profile(value_code, user_id);

-- Immutable change events allow later reports to resolve ownership and value at event time.
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
    changed_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_user_operations_change_user FOREIGN KEY (user_id) REFERENCES user_distribution_profile(user_id),
    CONSTRAINT fk_user_operations_change_actor FOREIGN KEY (changed_by_admin_id) REFERENCES admin_account(id),
    CONSTRAINT ck_user_operations_change_field CHECK (field_name IN ('OPERATOR', 'VALUE'))
);
CREATE INDEX idx_user_operations_change_history ON user_operations_profile_change(user_id, changed_at, id);

-- Keep the new server-side guild filters selective before the user-directory join.
CREATE INDEX idx_linky_binding_guild_user ON linky_account_binding(guild_id, user_id);
CREATE INDEX idx_timo_binding_guild_user ON platform_account_binding(platform_code, official_guild_id, user_id);
CREATE INDEX idx_user_profile_country_registered ON user_distribution_profile(country_code, registered_at, user_id);
