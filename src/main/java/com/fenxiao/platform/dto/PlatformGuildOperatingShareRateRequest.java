package com.fenxiao.platform.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
/** Saving this business configuration makes it effective immediately; it never creates a payout. */
public record PlatformGuildOperatingShareRateRequest(
        @NotNull @DecimalMin("0.0") @DecimalMax("1.0") BigDecimal operatingShareRate) {
}
