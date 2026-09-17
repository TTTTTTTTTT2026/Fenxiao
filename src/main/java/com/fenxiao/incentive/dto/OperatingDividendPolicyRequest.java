package com.fenxiao.incentive.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Shadow-only operating-dividend policy. It never authorizes a payout. */
public record OperatingDividendPolicyRequest(
        @NotBlank String platformCode,
        @NotBlank String countryCode,
        String guildId,
        @Positive int requiredValidStarts,
        @PositiveOrZero int requiredWithdrawEligible,
        @PositiveOrZero int requiredActive7d,
        @DecimalMin("0.0") @DecimalMax("0.30") BigDecimal profitShareRate,
        LocalDateTime effectiveFrom,
        LocalDateTime effectiveTo) {
}
