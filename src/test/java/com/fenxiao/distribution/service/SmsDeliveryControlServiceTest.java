package com.fenxiao.distribution.service;

import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.distribution.entity.SmsDeliveryControl;
import com.fenxiao.distribution.repository.SmsDeliveryControlRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SmsDeliveryControlServiceTest {
    private final SmsDeliveryControlRepository controls = mock(SmsDeliveryControlRepository.class);
    private final OperationAuditLogRepository audits = mock(OperationAuditLogRepository.class);
    @SuppressWarnings("unchecked")
    private final ObjectProvider<ChuanglanSmsSender> liveSender = mock(ObjectProvider.class);
    private final SmsDeliveryControlService service = new SmsDeliveryControlService(controls, audits, liveSender);
    private final AdminSessionService.AdminPrincipal admin = new AdminSessionService.AdminPrincipal(
            42L, "root", "Root", "super_admin", false, 7L, false, null, "*", "*", "*");

    @Test
    void defaultsOffAndRefusesToEnableWithoutDeploymentConfiguration() {
        when(controls.findById(1L)).thenReturn(Optional.empty());

        assertThat(service.status().active()).isFalse();
        assertThat(service.isLiveSendingEnabled()).isFalse();
        assertThatThrownBy(() -> service.setEnabled(true, admin, "127.0.0.1"))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("not configured");
        verify(controls, never()).save(any());
        verifyNoInteractions(audits);
    }

    @Test
    void storesChangesAndAuditsWithoutSecretsOrPhoneNumbers() {
        when(liveSender.getIfAvailable()).thenReturn(mock(ChuanglanSmsSender.class));
        when(controls.findById(1L)).thenReturn(Optional.empty());

        var enabled = service.setEnabled(true, admin, "127.0.0.1");

        assertThat(enabled.active()).isTrue();
        assertThat(enabled.updatedBy()).isEqualTo(42L);
        verify(controls).save(any(SmsDeliveryControl.class));
        var audit = org.mockito.ArgumentCaptor.forClass(OperationAuditLog.class);
        verify(audits).save(audit.capture());
        assertThat(audit.getValue().getActionName()).isEqualTo("ENABLE_LIVE_SMS");
        assertThat(audit.getValue().getBeforeData()).isEqualTo("false");
        assertThat(audit.getValue().getAfterData()).isEqualTo("true");
    }

    @Test
    void deploymentGateOverridesAnEnabledDatabaseSwitch() {
        SmsDeliveryControl persisted = SmsDeliveryControl.disabled();
        persisted.change(true, 42L, java.time.LocalDateTime.now(java.time.Clock.systemUTC()));
        when(controls.findById(1L)).thenReturn(Optional.of(persisted));

        assertThat(service.status().enabled()).isTrue();
        assertThat(service.status().active()).isFalse();
        assertThat(service.isLiveSendingEnabled()).isFalse();
    }
}
