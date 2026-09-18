package com.fenxiao.incentive.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/** Structured, operator-reviewed evidence for one Platinum cultivation group. */
public record UserGradePlatinumEvidenceRequest(
        @NotNull Long traineeUserId,
        @NotBlank String groupReference,
        @NotNull LocalDate observationStart,
        @NotNull LocalDate observationEnd,
        @NotNull @Min(5) Integer finalWeekEffectiveUserCount,
        @NotNull @Min(3) @Max(7) Integer finalWeekMinIncomeDateCount,
        @NotBlank String evidenceNote) { }
