package com.fenxiao.incentive.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/** Objective evidence for Diamond or Black Gold; business KPIs remain operator-reviewed. */
public record UserGradeAdvancedEvidenceRequest(
        @NotNull Long traineeUserId,
        @NotBlank String scopeReference,
        @NotNull LocalDate observationStart,
        @NotNull LocalDate observationEnd,
        @NotBlank String evidenceNote) { }
