package com.fenxiao.incentive.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** Manual exclusions are intentionally limited to confirmed bad evidence, never ordinary inactivity. */
public record EffectiveUserCorrectionRequest(@NotNull Long userId,
                                             @NotBlank String platformCode,
                                             @NotBlank String correctionReason,
                                             @NotBlank String correctionNote) { }
