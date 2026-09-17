package com.fenxiao.incentive.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record UserGradeLevelRequest(
        @NotBlank String levelName,
        @NotNull @Positive Integer levelRank,
        @NotNull @PositiveOrZero BigDecimal requiredPoints,
        boolean grantsTeamLeader,
        @NotNull LocalDateTime effectiveFrom,
        LocalDateTime effectiveTo) {
}
