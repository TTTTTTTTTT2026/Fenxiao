package com.fenxiao.platform.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/** Business configuration only; it never changes MCN income facts or creates a payout. */
public record PlatformGuildOperatingShareRateRequest(
        @NotNull @DecimalMin("0.0") @DecimalMax("1.0") BigDecimal operatingShareRate) {
}
