package com.fenxiao.admin.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AdminPermissionTest {

    @Test
    void limitsEffectiveUserEvidenceCorrectionsToSuperAdministrators() {
        assertThat(AdminPermission.EFFECTIVE_USER_READ.allows("super_admin")).isTrue();
        assertThat(AdminPermission.EFFECTIVE_USER_READ.allows("finance")).isTrue();
        assertThat(AdminPermission.EFFECTIVE_USER_READ.allows("operations")).isTrue();

        assertThat(AdminPermission.EFFECTIVE_USER_CORRECTION.allows("super_admin")).isTrue();
        assertThat(AdminPermission.EFFECTIVE_USER_CORRECTION.allows("finance")).isFalse();
        assertThat(AdminPermission.EFFECTIVE_USER_CORRECTION.allows("admin")).isFalse();
        assertThat(AdminPermission.EFFECTIVE_USER_CORRECTION.allows("operations")).isFalse();
    }
}
