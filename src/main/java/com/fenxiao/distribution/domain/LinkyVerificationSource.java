package com.fenxiao.distribution.domain;

import java.util.Locale;

public enum LinkyVerificationSource {
    LEGACY,
    MOCK,
    MCN;

    public static LinkyVerificationSource parse(String value) {
        if (value == null || value.isBlank()) return LEGACY;
        try {
            return valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("unsupported Linky verification source");
        }
    }
}
