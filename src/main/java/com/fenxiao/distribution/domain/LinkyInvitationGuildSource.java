package com.fenxiao.distribution.domain;

public enum LinkyInvitationGuildSource {
    VERIFIED_BINDING,
    FALLBACK_INHERITED,
    SYSTEM_DEFAULT,
    ADMIN_OVERRIDE;

    public boolean isEffectiveOverrideOrFact() {
        return this == VERIFIED_BINDING || this == ADMIN_OVERRIDE;
    }
}
