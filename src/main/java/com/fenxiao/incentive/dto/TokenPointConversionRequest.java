package com.fenxiao.incentive.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TokenPointConversionRequest(
        @NotBlank String platformCode,
        @NotNull @PositiveOrZero BigDecimal pointsPerToken,
        @NotNull LocalDateTime effectiveFrom,
        LocalDateTime effectiveTo) {
}
