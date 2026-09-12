package com.fenxiao.income.mcn.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fenxiao.income.mcn.domain.McnIncomeEventType;
import com.fenxiao.income.mcn.domain.McnIncomeSettlementStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record McnIncomeFactRequest(
        @NotBlank String sourceEventId,
        @NotBlank String sourceRevision,
        String originalSourceEventId,
        @NotBlank String platformUserId,
        @NotBlank String factGranularity,
        @NotNull McnIncomeEventType eventType,
        @NotNull McnIncomeSettlementStatus settlementStatus,
        @NotNull BigDecimal amount,
        @NotBlank String currencyCode,
        @NotBlank String amountUnit,
        @NotNull LocalDate businessDate,
        @NotBlank String sourceTimezone,
        @NotNull Instant periodStart,
        @NotNull Instant periodEnd,
        @NotNull Instant occurredAt,
        Instant settledAt,
        @NotNull Instant sourceUpdatedAt,
        String guildId,
        String settlementBasis,
        @NotNull JsonNode sourcePayload
) {
}
