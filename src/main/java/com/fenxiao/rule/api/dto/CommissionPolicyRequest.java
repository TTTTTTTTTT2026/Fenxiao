package com.fenxiao.rule.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CommissionPolicyRequest(@NotBlank @Pattern(regexp = "ALL|TIMO|LINKY") String platformCode,
                                      @NotBlank @Pattern(regexp = "[A-Za-z]{2,10}|ALL") String countryCode,
                                      @NotBlank @Pattern(regexp = "[A-Z_]{2,32}|ALL") String roleCode,
                                      @Min(1) @Max(3) int maxRewardLevel,
                                      @NotNull @Valid List<LevelRequest> levels,
                                      @NotNull LocalDateTime effectiveFrom, LocalDateTime effectiveTo) {
    public record LevelRequest(@Min(1) @Max(3) int rewardLevel, boolean enabled,
                               @DecimalMin(value = "0.000001", inclusive = true) @DecimalMax(value = "1.000000") BigDecimal rewardRate,
                               @Min(0) @Max(3650) Integer freezeDays) { }
}
