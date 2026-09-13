package com.fenxiao.income.mcn.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record McnIncomeShadowLedgerRefreshRequest(@NotBlank String platformCode, @NotNull LocalDate businessDate) { }
