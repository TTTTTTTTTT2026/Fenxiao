package com.fenxiao.income.mcn.external;

import com.fasterxml.jackson.databind.JsonNode;
import com.fenxiao.income.mcn.dto.McnIncomeFactRequest;

import java.time.Instant;
import java.util.List;

public record McnIncomeFactsPage(String platformCode, String deliveryId, Instant snapshotAt,
                                 String sourceStatus, JsonNode sourceWatermark,
                                 List<McnIncomeFactRequest> facts, String nextCursor, boolean hasMore,
                                 Integer retryAfterSeconds, String requestId) {
    public boolean isReady() { return "READY".equals(sourceStatus); }
    public boolean isStale() { return "STALE".equals(sourceStatus); }
}
