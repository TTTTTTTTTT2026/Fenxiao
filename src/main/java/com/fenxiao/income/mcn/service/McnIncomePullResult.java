package com.fenxiao.income.mcn.service;

public record McnIncomePullResult(String platformCode, String status, String deliveryId,
                                  int receivedCount, int newCount, int duplicateCount, int unmatchedCount,
                                  boolean hasMore, Integer retryAfterSeconds) {
}
