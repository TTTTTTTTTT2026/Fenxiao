package com.fenxiao.income.mcn.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record McnIncomeDeliveryRequest(
        @NotBlank String deliveryId,
        @NotBlank String sourceSystem,
        @NotBlank String platformCode,
        @NotEmpty List<@Valid McnIncomeFactRequest> facts
) {
}
