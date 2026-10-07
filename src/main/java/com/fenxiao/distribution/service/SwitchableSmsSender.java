package com.fenxiao.distribution.service;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

@Component
@Primary
public class SwitchableSmsSender implements SmsSender {
    private final SmsDeliveryControlService controls;
    private final LoggingSmsSender loggingSender;
    private final ObjectProvider<ChuanglanSmsSender> liveSender;

    public SwitchableSmsSender(SmsDeliveryControlService controls, LoggingSmsSender loggingSender,
                               ObjectProvider<ChuanglanSmsSender> liveSender) {
        this.controls = controls;
        this.loggingSender = loggingSender;
        this.liveSender = liveSender;
    }

    @Override
    public String deliveryChannel() { return controls.isLiveSendingEnabled() ? "CHUANGLAN" : "INTERNAL"; }

    @Override
    public String deliveryChannel(String phoneNumber) {
        return isChinaNumber(phoneNumber) ? "INTERNAL" : deliveryChannel();
    }

    @Override
    public void sendVerificationCode(String phoneNumber, String verificationCode, int ttlMinutes) {
        // +86 stays available for assisted sign-in through the admin audit, even when live SMS is enabled.
        if (isChinaNumber(phoneNumber)) {
            loggingSender.sendVerificationCode(phoneNumber, verificationCode, ttlMinutes);
            return;
        }
        if (controls.isLiveSendingEnabled()) {
            ChuanglanSmsSender sender = liveSender.getIfAvailable();
            if (sender == null) throw new IllegalStateException("verification SMS is temporarily unavailable");
            sender.sendVerificationCode(phoneNumber, verificationCode, ttlMinutes);
        } else {
            loggingSender.sendVerificationCode(phoneNumber, verificationCode, ttlMinutes);
        }
    }

    private boolean isChinaNumber(String phoneNumber) {
        String normalized = PhoneAuthService.normalizePhone(phoneNumber);
        return normalized.startsWith("+86") || normalized.startsWith("86");
    }
}
