package com.fenxiao.income.mcn.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.time.Instant;
import com.fasterxml.jackson.databind.JsonNode;

public record McnIncomeDeliveryRequest(
        @NotBlank String deliveryId,
        @NotBlank String sourceSystem,
        @NotBlank String platformCode,
        @NotNull Instant snapshotAt,
        @NotNull JsonNode sourceWatermark,
        @NotEmpty List<@Valid McnIncomeFactRequest> facts
) {
}
