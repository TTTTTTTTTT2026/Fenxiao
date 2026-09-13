package com.fenxiao.income.mcn.external;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record McnIncomeFactsReconciliationPage(String platformCode, String snapshotId, Instant snapshotAt,
                                               String sourceStatus, JsonNode sourceWatermark,
                                               LocalDate businessDateFrom, LocalDate businessDateTo,
                                               List<McnIncomeFactsReconciliationGroup> groups,
                                               Integer retryAfterSeconds, String requestId) {
    public boolean isReady() { return "READY".equals(sourceStatus); }
    public boolean isStale() { return "STALE".equals(sourceStatus); }
}
