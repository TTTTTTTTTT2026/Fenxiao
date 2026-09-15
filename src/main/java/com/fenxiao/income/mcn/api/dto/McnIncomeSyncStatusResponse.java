package com.fenxiao.income.mcn.api.dto;

import java.time.Instant;
import java.util.List;

/** Operational state only; no credentials, cursors, accounts or income facts are exposed. */
public record McnIncomeSyncStatusResponse(boolean continuousPullEnabled, int maxPagesPerRun,
                                          List<PlatformStatus> platforms) {
    public record PlatformStatus(String platformCode, String checkpointStatus, Instant lastSuccessAt,
                                 Instant lastSnapshotAt, String lastWatermarkCompleteness, Instant nextAttemptAt,
                                 String lastErrorCode, String latestRunStatus,
                                 Instant latestRunAt, int latestReceivedCount, int latestNewCount,
                                 int latestDuplicateCount, int latestUnmatchedCount, Integer retryAfterSeconds) { }
}
