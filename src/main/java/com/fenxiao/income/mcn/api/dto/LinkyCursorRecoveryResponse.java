package com.fenxiao.income.mcn.api.dto;

import java.time.LocalDate;

/** Deliberately excludes MCN cursor values and source account details. */
public record LinkyCursorRecoveryResponse(String status, LocalDate businessDate, int pageCount,
                                          int receivedFactCount, int newFactCount, int duplicateFactCount,
                                          int unmatchedFactCount, String reconciliationStatus,
                                          int mismatchGroupCount, boolean readyForContinuousRebuild) { }
