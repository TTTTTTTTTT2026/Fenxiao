package com.fenxiao.incentive.dto;

import jakarta.validation.constraints.NotBlank;

/** Each decision is separately recorded. Notes are required for future audit, not reward settlement. */
public record UserGradeAdvancementReviewDecisionRequest(@NotBlank String note) { }
