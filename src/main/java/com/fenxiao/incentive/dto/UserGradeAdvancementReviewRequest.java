package com.fenxiao.incentive.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UserGradeAdvancementReviewRequest(
        @NotNull Long userId,
        @NotBlank String platformCode,
        @NotBlank String guildId,
        @NotBlank String targetGradeCode) { }
