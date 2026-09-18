package com.fenxiao.incentive.dto;

import java.math.BigDecimal;
import java.util.List;

public record UserPointDashboardResponse(
        String platformCode,
        long accruedFactCount,
        long blockedFactCount,
        long revokedFactCount,
        BigDecimal accruedPointTotal,
        List<UserPointBalanceResponse> topBalances,
        List<UserPointFactResponse> recentFacts) {
}
