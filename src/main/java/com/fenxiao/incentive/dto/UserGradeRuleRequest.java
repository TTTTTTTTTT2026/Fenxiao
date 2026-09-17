package com.fenxiao.incentive.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** A rule evaluates only the user's direct invitees, never indirect invitation descendants. */
public record UserGradeRuleRequest(
        @NotBlank String gradeCode,
        @NotBlank String platformCode,
        @NotBlank String countryCode,
        String guildId,
        @Min(0) int requiredDirectInviteCount,
        @NotNull @DecimalMin("0.0") BigDecimal requiredDirectIncome,
        LocalDateTime effectiveFrom,
        LocalDateTime effectiveTo) {
}
