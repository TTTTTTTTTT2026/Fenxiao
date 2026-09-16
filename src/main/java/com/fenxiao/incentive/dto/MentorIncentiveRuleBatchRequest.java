package com.fenxiao.incentive.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

import java.time.LocalDateTime;
import java.util.List;

/** Creates one mentor-rule draft per authoritative guild selection; an empty selection means all guilds. */
public record MentorIncentiveRuleBatchRequest(
        @NotBlank String milestoneCode,
        @NotBlank String platformCode,
        @NotBlank String countryCode,
        List<String> guildIds,
        @PositiveOrZero long amountMinor,
        @NotBlank String currencyCode,
        @PositiveOrZero int freezeDays,
        LocalDateTime effectiveFrom,
        LocalDateTime effectiveTo) {
}
