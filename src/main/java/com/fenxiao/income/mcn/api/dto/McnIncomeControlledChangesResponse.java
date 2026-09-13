package com.fenxiao.income.mcn.api.dto;

/** Sanitised result: it deliberately contains no facts, account IDs, source payloads or signatures. */
public record McnIncomeControlledChangesResponse(
        String runId, String requestId, int httpStatus, long latencyMillis, String sourceStatus,
        String deliveryHash, int factCount, int newFactCount, int duplicateFactCount,
        int unmatchedFactCount, boolean hasMore, String nextCursor, String nextCursorHash,
        boolean cursorPersisted, Integer retryAfterSeconds
) { }
