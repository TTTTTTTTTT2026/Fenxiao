package com.fenxiao.income.mcn.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record McnIncomeShadowLedgerReplayRequest(
        @NotBlank String platformCode,
        @NotNull LocalDate businessDate,
        @NotBlank @Size(max = 255) String reason) { }
