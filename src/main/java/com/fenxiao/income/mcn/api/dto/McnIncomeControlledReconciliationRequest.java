package com.fenxiao.income.mcn.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record McnIncomeControlledReconciliationRequest(
        @NotBlank String platformCode,
        @NotNull LocalDate businessDateFrom,
        @NotNull LocalDate businessDateTo,
        List<String> guildIds
) { }
