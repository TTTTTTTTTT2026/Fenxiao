package com.fenxiao.income.mcn.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record McnIncomeDataQualityReviewRequest(
        @NotBlank @Size(max = 128) String sourceEventReference,
        @NotBlank @Size(max = 512) String sourceRevision,
        @NotBlank @Pattern(regexp = "ACKNOWLEDGED|IGNORED") String reviewStatus,
        @NotBlank @Size(max = 255) String reviewNote) { }
