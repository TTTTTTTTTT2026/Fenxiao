package com.fenxiao.distribution.api.dto;

import java.util.List;

public record PreRegistrationResponse(List<Item> items, int page, long total, boolean hasNext,
                                      boolean canAddTimo, boolean canAddLinky) {
    public record Item(Long id, Long userId, String countryCode, String maskedPhone, String platformCode,
                       String maskedAccount, String status, String reasonCode, String submittedAt, String expiresAt,
                       String lastCheckedAt, int attemptCount, long revision, boolean claimed, boolean canEdit) {}
}
