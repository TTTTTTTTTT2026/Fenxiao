package com.fenxiao.incentive.dto;

import java.time.LocalDateTime;

public record MentorShadowLedgerItemResponse(
        long id, long recipientUserId, long sourceUserId, String platformCode,
        String milestoneCode, String ruleCode, int ruleVersion, long amountMinor,
        String currencyCode, String ledgerStatus, LocalDateTime triggeredAt) {
}
