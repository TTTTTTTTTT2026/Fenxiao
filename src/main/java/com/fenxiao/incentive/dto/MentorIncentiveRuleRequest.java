package com.fenxiao.incentive.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import java.time.LocalDateTime;

/** A fixed-amount, milestone-based mentor reward. It is always shadow-only. */
public record MentorIncentiveRuleRequest(
        @NotBlank String milestoneCode,
        @NotBlank String platformCode,
        @NotBlank String countryCode,
        String guildId,
        @PositiveOrZero long amountMinor,
        @NotBlank String currencyCode,
        @PositiveOrZero int freezeDays,
        LocalDateTime effectiveFrom,
        LocalDateTime effectiveTo) {
}
