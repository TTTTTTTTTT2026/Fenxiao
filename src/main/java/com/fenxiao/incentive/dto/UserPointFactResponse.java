package com.fenxiao.incentive.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Evidence that an inviter received points from one direct invitee's settled income. */
public record UserPointFactResponse(
        String platformCode,
        String sourceEventId,
        Long sourceUserId,
        Long beneficiaryUserId,
        Integer invitationVersionNo,
        Long conversionId,
        String tokenUnit,
        BigDecimal sourceAmount,
        BigDecimal pointsPerToken,
        BigDecimal pointAmount,
        LocalDateTime occurredAt,
        String factStatus,
        String decisionReason,
        LocalDateTime projectedAt) {
}
