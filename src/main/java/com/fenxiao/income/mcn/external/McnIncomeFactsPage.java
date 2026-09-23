package com.fenxiao.income.mcn.external;

import com.fasterxml.jackson.databind.JsonNode;
import com.fenxiao.income.mcn.dto.McnIncomeFactRequest;

import java.time.Instant;
import java.util.List;

public record McnIncomeFactsPage(String platformCode, String deliveryId, Instant snapshotAt,
                                 String sourceStatus, JsonNode sourceWatermark,
                                 List<McnIncomeFactRequest> facts, String nextCursor, boolean hasMore,
                                 Integer retryAfterSeconds, String requestId, String scopeHash,
                                 List<String> scopedPlatformUserIds) {
    public McnIncomeFactsPage(String platformCode, String deliveryId, Instant snapshotAt,
                              String sourceStatus, JsonNode sourceWatermark, List<McnIncomeFactRequest> facts,
                              String nextCursor, boolean hasMore, Integer retryAfterSeconds, String requestId) {
        this(platformCode, deliveryId, snapshotAt, sourceStatus, sourceWatermark, facts, nextCursor, hasMore,
                retryAfterSeconds, requestId, null, List.of());
    }
    public boolean isReady() { return "READY".equals(sourceStatus); }
    public boolean isStale() { return "STALE".equals(sourceStatus); }
}
