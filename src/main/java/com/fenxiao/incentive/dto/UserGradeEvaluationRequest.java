package com.fenxiao.incentive.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UserGradeEvaluationRequest(@NotNull Long userId, @NotBlank String platformCode) {
}
