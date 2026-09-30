package com.fenxiao.admin.api.dto;

import java.time.LocalDateTime;

public record PhoneVerificationCodeListItem(
        Long id,
        String phoneNumber,
        String purpose,
        String status,
        String deliveryChannel,
        String deliveryStatus,
        String deliveryErrorCode,
        int attempts,
        boolean consumed,
        LocalDateTime issuedAt,
        LocalDateTime expiresAt,
        LocalDateTime updatedAt
) {}
