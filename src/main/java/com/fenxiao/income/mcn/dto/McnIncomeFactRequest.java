package com.fenxiao.income.mcn.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fenxiao.income.mcn.domain.McnIncomeEventType;
import com.fenxiao.income.mcn.domain.McnIncomeSettlementStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record McnIncomeFactRequest(
        @NotBlank String sourceEventId,
        @NotBlank String sourceRevision,
        String originalSourceEventId,
        @NotBlank String platformUserId,
        @NotNull McnIncomeEventType eventType,
        @NotNull McnIncomeSettlementStatus settlementStatus,
        @NotNull BigDecimal amount,
        @NotBlank String currencyCode,
        @NotNull LocalDateTime occurredAt,
        LocalDateTime settledAt,
        @NotNull LocalDateTime sourceUpdatedAt,
        String guildId,
        @NotNull JsonNode sourcePayload
) {
}
