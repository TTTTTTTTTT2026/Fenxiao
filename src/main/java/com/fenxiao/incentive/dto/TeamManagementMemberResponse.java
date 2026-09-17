package com.fenxiao.incentive.dto;

import java.time.LocalDateTime;

public record TeamManagementMemberResponse(
        long userId,
        String phoneNumber,
        String countryCode,
        String memberRole,
        String sourceType,
        LocalDateTime effectiveFrom) {
}
