package com.fenxiao.platform.service;

import com.fenxiao.platform.domain.PlatformVerificationSource;

public interface PlatformVerificationProvider {
    PlatformVerificationSource source();
    PlatformVerificationResult verify(PlatformVerificationRequest request);
}
