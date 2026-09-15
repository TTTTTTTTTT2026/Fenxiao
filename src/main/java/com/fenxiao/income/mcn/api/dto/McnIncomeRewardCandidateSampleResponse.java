package com.fenxiao.income.mcn.api.dto;

import java.time.LocalDate;
import java.util.List;

/** Deterministic, non-payable review sample captured from one immutable candidate run. */
public record McnIncomeRewardCandidateSampleResponse(String runId, String platformCode, LocalDate businessDate,
                                                      int requestedSize, int availableCount,
                                                      int candidateAvailableCount, int blockedAvailableCount,
                                                      List<McnIncomeRewardCandidateItemResponse> items) { }
