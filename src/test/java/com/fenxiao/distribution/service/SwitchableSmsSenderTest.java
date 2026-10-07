package com.fenxiao.distribution.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;

import static org.assertj.core.api.Assertions.assertThat;
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

    @Test
    void chinaNumberAlwaysStaysInternalWhenLiveSwitchIsOpen() {
        when(controls.isLiveSendingEnabled()).thenReturn(true);

        assertThat(sender.deliveryChannel("+8613800000000")).isEqualTo("INTERNAL");
        sender.sendVerificationCode("+8613800000000", "123456", 10);

        verify(fallback).sendVerificationCode("+8613800000000", "123456", 10);
        verifyNoInteractions(provider, live);
    }

    @Test
    void otherCountryStillUsesLiveChannelWhenSwitchIsOpen() {
        when(controls.isLiveSendingEnabled()).thenReturn(true);
        when(provider.getIfAvailable()).thenReturn(live);

        assertThat(sender.deliveryChannel("+628123456789")).isEqualTo("CHUANGLAN");
        sender.sendVerificationCode("+628123456789", "123456", 10);

        verify(live).sendVerificationCode("+628123456789", "123456", 10);
        verifyNoInteractions(fallback);
    }
}
