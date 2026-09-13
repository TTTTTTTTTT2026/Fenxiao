package com.fenxiao.income.mcn.api.dto;

import java.time.LocalDate;

/**
 * Counts-only quality view for a single MCN income business day. It deliberately
 * contains neither platform account identifiers nor monetary values.
 */
public record McnIncomeDataQualityResponse(String platformCode, LocalDate businessDate,
                                           int latestFactCount, int projectedFactCount,
                                           int boundFinalCount, int unmatchedCount,
                                           int awaitingFinalityCount, int voidedCount,
                                           int bindingCoveragePercent,
                                           String projectionStatus, String latestRunId) { }
