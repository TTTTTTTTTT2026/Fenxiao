package com.fenxiao.admin.api.dto;

import java.time.LocalDateTime;

public record SeedInviterListItem(
        long userId,
        String phoneNumber,
        String countryCode,
        String languageCode,
        String inviteCode,
        String accountStatus,
        String userStatus,
        boolean effectiveUser,
        long directInviteeCount,
        LocalDateTime createdAt,
        long createdBy,
        String createdByRole) {
}
