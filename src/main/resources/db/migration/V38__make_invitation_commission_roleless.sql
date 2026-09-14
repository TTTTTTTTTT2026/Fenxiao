-- Invitation commission applies to every eligible invitee; role_code remains only for V36 schema compatibility.
UPDATE commission_policy SET role_code = 'ALL';

CREATE INDEX idx_commission_policy_invitation_effective
    ON commission_policy (commission_type, platform_code, country_code, status, effective_from);
