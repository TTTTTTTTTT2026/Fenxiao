package com.fenxiao.distribution.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;

import static org.mockito.Mockito.*;

class SwitchableSmsSenderTest {
    private final SmsDeliveryControlService controls = mock(SmsDeliveryControlService.class);
    private final LoggingSmsSender fallback = mock(LoggingSmsSender.class);
    @SuppressWarnings("unchecked")
    private final ObjectProvider<ChuanglanSmsSender> provider = mock(ObjectProvider.class);
    private final ChuanglanSmsSender live = mock(ChuanglanSmsSender.class);
    private final SwitchableSmsSender sender = new SwitchableSmsSender(controls, fallback, provider);

    @Test
    void closedSwitchNeverContactsChuanglan() {
        when(controls.isLiveSendingEnabled()).thenReturn(false);

        sender.sendVerificationCode("+85250000001", "123456", 10);

        verify(fallback).sendVerificationCode("+85250000001", "123456", 10);
        verifyNoInteractions(provider, live);
    }

    @Test
    void openedSwitchUsesChuanglanOnly() {
        when(controls.isLiveSendingEnabled()).thenReturn(true);
        when(provider.getIfAvailable()).thenReturn(live);

        sender.sendVerificationCode("+85250000001", "123456", 10);

        verify(live).sendVerificationCode("+85250000001", "123456", 10);
        verifyNoInteractions(fallback);
    }
}
