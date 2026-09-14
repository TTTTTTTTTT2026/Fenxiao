package com.fenxiao.income.mcn.service;

/** Aggregated result for one bounded scheduled pull. It contains no cursor, account or source-fact content. */
public record McnIncomePullBatchResult(String platformCode, String status, int pageCount,
                                       int receivedCount, int newCount, int duplicateCount, int unmatchedCount,
                                       boolean hasMore, Integer retryAfterSeconds) { }
