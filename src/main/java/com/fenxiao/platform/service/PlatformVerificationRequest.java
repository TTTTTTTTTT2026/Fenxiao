package com.fenxiao.platform.service;

import java.time.LocalDateTime;

public record PlatformVerificationRequest(
        Long userId,
        String platformCode,
        String platformUserId,
        String countryCode,
        String expectedGuildId,
        String expectedCountry,
        LocalDateTime bindingSubmittedAt) {
}
