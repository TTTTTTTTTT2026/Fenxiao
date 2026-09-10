package com.fenxiao.platform.service;

import com.fenxiao.platform.domain.PlatformVerificationSource;
import org.springframework.stereotype.Component;

@Component
public class McnPlatformVerificationProvider implements PlatformVerificationProvider {
    @Override
    public PlatformVerificationSource source() { return PlatformVerificationSource.MCN; }

    @Override
    public PlatformVerificationResult verify(String platformCode, String platformUserId) {
        throw new IllegalStateException("MCN verification client is not configured yet; configure production credentials before enabling verification");
    }
}
