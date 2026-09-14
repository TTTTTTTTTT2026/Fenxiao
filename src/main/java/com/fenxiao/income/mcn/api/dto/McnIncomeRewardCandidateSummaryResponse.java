package com.fenxiao.income.mcn.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/** A non-payable preview of the current business rules over MCN income facts. */
public record McnIncomeRewardCandidateSummaryResponse(String platformCode, LocalDate businessDate,
                                                       int sourceFactCount, int sourceReadyCount,
                                                       int candidateCount, int blockedCount,
                                                       BigDecimal candidateAmount, String amountUnit,
                                                       String latestRunId) { }
