package com.fenxiao.incentive.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** Creates one operating-dividend draft per selected authoritative guild; an empty selection covers all guilds. */
public record OperatingDividendPolicyBatchRequest(
        @NotBlank String platformCode,
        @NotBlank String countryCode,
        List<String> guildIds,
        @Positive int requiredValidStarts,
        @PositiveOrZero int requiredWithdrawEligible,
        @PositiveOrZero int requiredActive7d,
        @DecimalMin("0.0") @DecimalMax("0.30") BigDecimal profitShareRate,
        LocalDateTime effectiveFrom,
        LocalDateTime effectiveTo) {
}
