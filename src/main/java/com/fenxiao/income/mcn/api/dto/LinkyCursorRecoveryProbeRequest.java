package com.fenxiao.income.mcn.api.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/** A single FINAL business date used to verify recovery before a full cursor rebuild. */
public record LinkyCursorRecoveryProbeRequest(@NotNull LocalDate businessDate) { }
