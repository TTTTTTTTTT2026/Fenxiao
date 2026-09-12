package com.fenxiao.income.mcn.entity;

import com.fenxiao.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

import java.time.Instant;

/** Audit record for one MCN page pull; it contains no secrets or source personal data. */
@Entity
@Table(name = "mcn_income_sync_run")
public class McnIncomeSyncRun extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "run_id", nullable = false, length = 64) private String runId;
    @Column(name = "platform_code", nullable = false, length = 32) private String platformCode;
    @Column(name = "requested_cursor", length = 1024) private String requestedCursor;
    @Column(name = "delivery_id", length = 128) private String deliveryId;
    @Column(name = "request_id", length = 128) private String requestId;
    @Column(name = "sync_status", nullable = false, length = 32) private String syncStatus;
    @Column(name = "received_count", nullable = false) private int receivedCount;
    @Column(name = "new_count", nullable = false) private int newCount;
    @Column(name = "duplicate_count", nullable = false) private int duplicateCount;
    @Column(name = "unmatched_count", nullable = false) private int unmatchedCount;
    @Column(name = "snapshot_at") private Instant snapshotAt;
    @Lob @Column(name = "source_watermark", columnDefinition = "LONGTEXT") private String sourceWatermark;
    @Column(name = "retry_after_seconds") private Integer retryAfterSeconds;
    @Column(name = "started_at", nullable = false) private Instant startedAt;
    @Column(name = "completed_at", nullable = false) private Instant completedAt;
    @Column(name = "error_code", length = 64) private String errorCode;
    @Column(name = "error_message", length = 512) private String errorMessage;

    protected McnIncomeSyncRun() {}

    public static McnIncomeSyncRun success(String runId, String platformCode, String requestedCursor, String deliveryId,
                                           String requestId, int received, int added, int duplicate, int unmatched,
                                           Instant snapshotAt, String sourceWatermark, Instant at) {
        McnIncomeSyncRun value = base(runId, platformCode, requestedCursor, "SUCCESS", at);
        value.deliveryId = deliveryId; value.requestId = requestId; value.receivedCount = received; value.newCount = added;
        value.duplicateCount = duplicate; value.unmatchedCount = unmatched; value.snapshotAt = snapshotAt;
        value.sourceWatermark = sourceWatermark; return value;
    }

    public static McnIncomeSyncRun stale(String runId, String platformCode, String requestedCursor, String requestId,
                                         String sourceWatermark, Integer retryAfterSeconds, Instant at) {
        McnIncomeSyncRun value = base(runId, platformCode, requestedCursor, "STALE", at);
        value.requestId = requestId; value.sourceWatermark = sourceWatermark; value.retryAfterSeconds = retryAfterSeconds;
        return value;
    }

    public static McnIncomeSyncRun failed(String runId, String platformCode, String requestedCursor, String errorCode,
                                          String errorMessage, Integer retryAfterSeconds, Instant at) {
        McnIncomeSyncRun value = base(runId, platformCode, requestedCursor, "FAILED", at);
        value.errorCode = truncate(errorCode, 64); value.errorMessage = truncate(errorMessage, 512);
        value.retryAfterSeconds = retryAfterSeconds; return value;
    }

    private static McnIncomeSyncRun base(String runId, String platformCode, String requestedCursor, String status, Instant at) {
        McnIncomeSyncRun value = new McnIncomeSyncRun(); value.runId = runId; value.platformCode = platformCode;
        value.requestedCursor = requestedCursor; value.syncStatus = status; value.startedAt = at; value.completedAt = at; return value;
    }
    private static String truncate(String value, int length) { return value == null ? null : value.substring(0, Math.min(value.length(), length)); }
}
