package com.fenxiao.distribution.service;

import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.distribution.entity.SmsDeliveryControl;
import com.fenxiao.distribution.repository.SmsDeliveryControlRepository;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;

@Service
public class SmsDeliveryControlService {
    private static final long CONTROL_ID = 1L;
    private final SmsDeliveryControlRepository controls;
    private final OperationAuditLogRepository audits;
    private final ObjectProvider<ChuanglanSmsSender> liveSender;
    private final Clock clock = Clock.systemUTC();

    public SmsDeliveryControlService(SmsDeliveryControlRepository controls,
                                     OperationAuditLogRepository audits,
                                     ObjectProvider<ChuanglanSmsSender> liveSender) {
        this.controls = controls;
        this.audits = audits;
        this.liveSender = liveSender;
    }

    @Transactional(readOnly = true)
    public Status status() {
        SmsDeliveryControl control = controls.findById(CONTROL_ID).orElseGet(SmsDeliveryControl::disabled);
        boolean ready = liveSender.getIfAvailable() != null;
        return new Status(control.isEnabled(), ready, control.isEnabled() && ready,
                control.getUpdatedAt(), control.getUpdatedBy());
    }

    @Transactional(readOnly = true)
    public boolean isLiveSendingEnabled() {
        // A missing row or unavailable deployment-side adapter always fails closed.
        return controls.findById(CONTROL_ID).map(SmsDeliveryControl::isEnabled).orElse(false)
                && liveSender.getIfAvailable() != null;
    }

    @Transactional
    public Status setEnabled(boolean enabled, AdminSessionService.AdminPrincipal actor, String requestIp) {
        if (enabled && liveSender.getIfAvailable() == null) {
            throw new IllegalArgumentException("Chuanglan SMS is not configured on this server");
        }
        SmsDeliveryControl control = controls.findById(CONTROL_ID).orElseGet(SmsDeliveryControl::disabled);
        if (control.isEnabled() != enabled) {
            boolean before = control.isEnabled();
            LocalDateTime at = LocalDateTime.now(clock);
            control.change(enabled, actor.accountId(), at);
            controls.save(control);
            audits.save(OperationAuditLog.create(actor.accountId(), actor.role(), "sms_delivery", "sms_delivery_control",
                    CONTROL_ID, enabled ? "ENABLE_LIVE_SMS" : "DISABLE_LIVE_SMS",
                    Boolean.toString(before), Boolean.toString(enabled), requestIp, "Chuanglan SMS runtime switch", at));
        }
        return new Status(control.isEnabled(), liveSender.getIfAvailable() != null,
                control.isEnabled() && liveSender.getIfAvailable() != null,
                control.getUpdatedAt(), control.getUpdatedBy());
    }

    public record Status(boolean enabled, boolean ready, boolean active, LocalDateTime updatedAt, Long updatedBy) {}
}
