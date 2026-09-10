package com.fenxiao.platform.domain;

import java.util.Locale;

public enum PlatformVerificationSource {
    MOCK,
    MCN,
    DISABLED;

    public static PlatformVerificationSource parse(String value) {
        if (value == null || value.isBlank()) return MCN;
        try {
            return valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException("platform verification source must be MOCK, MCN, or DISABLED");
        }
    }
}
