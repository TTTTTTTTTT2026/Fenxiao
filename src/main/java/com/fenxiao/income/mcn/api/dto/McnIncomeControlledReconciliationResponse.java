package com.fenxiao.income.mcn.api.dto;

/** Aggregate-only comparison result for the controlled window. */
public record McnIncomeControlledReconciliationResponse(
        String runId, String requestId, String sourceStatus, String comparisonStatus,
        int mcnGroupCount, int banDeiraGroupCount, int mismatchGroupCount, Integer retryAfterSeconds
) { }
