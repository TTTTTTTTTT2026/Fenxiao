package com.fenxiao.incentive.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OperatingDividendShadowEntryResponse(
        long id, long teamId, long leaderUserId, String platformCode, long policyId,
        BigDecimal shareRate, long shareAmountMinor, String currencyCode, String ledgerStatus,
        LocalDateTime triggeredAt) {
}
