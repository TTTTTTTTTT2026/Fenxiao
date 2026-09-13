package com.fenxiao.income.mcn.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/** A bounded changes request used only during an authorised production smoke window. */
public record McnIncomeControlledChangesRequest(
        @NotBlank String platformCode,
        String cursor,
        @NotNull LocalDate businessDateFrom,
        @NotNull LocalDate businessDateTo,
        @Min(1) @Max(500) Integer pageSize,
        String requestId
) { }
