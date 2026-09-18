package com.fenxiao.incentive.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record UserPointBalanceResponse(
        long userId,
        BigDecimal totalPoints,
        int accruedFactCount,
        LocalDateTime latestIncomeAt,
        LocalDateTime evaluatedAt) {
}
