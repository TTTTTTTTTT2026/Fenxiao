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
    public void sendVerificationCode(String phoneNumber, String verificationCode, int ttlMinutes) {
        if (controls.isLiveSendingEnabled()) {
            ChuanglanSmsSender sender = liveSender.getIfAvailable();
            if (sender == null) throw new IllegalStateException("verification SMS is temporarily unavailable");
            sender.sendVerificationCode(phoneNumber, verificationCode, ttlMinutes);
        } else {
            loggingSender.sendVerificationCode(phoneNumber, verificationCode, ttlMinutes);
        }
    }
}
