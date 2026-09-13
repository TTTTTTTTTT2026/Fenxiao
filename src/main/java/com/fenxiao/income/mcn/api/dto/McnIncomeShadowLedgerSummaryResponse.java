package com.fenxiao.income.mcn.api.dto;

import java.time.LocalDate;

/** Counts only: the admin summary intentionally exposes no platform accounts or raw facts. */
public record McnIncomeShadowLedgerSummaryResponse(String platformCode, LocalDate businessDate,
                                                    int sourceFactCount, int latestFactCount,
                                                    int boundFinalCount, int unmatchedCount,
                                                    int awaitingFinalityCount, int voidedCount,
                                                    String latestRunId) { }
