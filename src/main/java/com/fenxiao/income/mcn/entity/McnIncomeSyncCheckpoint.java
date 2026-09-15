package com.fenxiao.income.mcn.entity;

import com.fenxiao.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

import java.time.Instant;

/** Per-platform durable cursor. It advances only after the complete page reaches the raw ledger. */
@Entity
@Table(name = "mcn_income_sync_checkpoint")
public class McnIncomeSyncCheckpoint extends BaseEntity {
    @Id
    @Column(name = "platform_code", length = 32)
    private String platformCode;
    @Column(name = "next_cursor", length = 1024)
    private String nextCursor;
    @Column(name = "last_snapshot_at")
    private Instant lastSnapshotAt;
    @Lob
    @Column(name = "last_source_watermark", columnDefinition = "LONGTEXT")
    private String lastSourceWatermark;
    @Column(name = "last_sync_status", nullable = false, length = 32)
    private String lastSyncStatus;
    @Column(name = "last_success_at")
    private Instant lastSuccessAt;
    @Column(name = "last_error_code", length = 64)
    private String lastErrorCode;
    @Column(name = "last_error_message", length = 512)
    private String lastErrorMessage;
    @Column(name = "next_attempt_at")
    private Instant nextAttemptAt;

    protected McnIncomeSyncCheckpoint() {}

    public static McnIncomeSyncCheckpoint initial(String platformCode) {
        McnIncomeSyncCheckpoint value = new McnIncomeSyncCheckpoint();
        value.platformCode = platformCode;
        value.lastSyncStatus = "NEVER_RUN";
        return value;
    }

    public void advance(String nextCursor, Instant snapshotAt, String sourceWatermark, Instant at) {
        this.nextCursor = nextCursor;
        this.lastSnapshotAt = snapshotAt;
        this.lastSourceWatermark = sourceWatermark;
        this.lastSyncStatus = "SUCCESS";
        this.lastSuccessAt = at;
        this.lastErrorCode = null;
        this.lastErrorMessage = null;
        this.nextAttemptAt = null;
    }

    public void markStale(String sourceWatermark, Instant nextAttemptAt) {
        this.lastSyncStatus = "STALE";
        this.lastSourceWatermark = sourceWatermark;
        this.nextAttemptAt = nextAttemptAt;
        this.lastErrorCode = null;
        this.lastErrorMessage = null;
    }

    public void waitForFinality(String sourceWatermark, Instant nextAttemptAt) {
        this.lastSyncStatus = "WAITING_FINALITY";
        this.lastSourceWatermark = sourceWatermark;
        this.nextAttemptAt = nextAttemptAt;
        this.lastErrorCode = null;
        this.lastErrorMessage = null;
    }

    public void throttle(String code, String message, Instant nextAttemptAt) {
        this.lastSyncStatus = "THROTTLED";
        this.lastErrorCode = truncate(code, 64);
        this.lastErrorMessage = truncate(message, 512);
        this.nextAttemptAt = nextAttemptAt;
    }

    public void fail(String code, String message) {
        this.lastSyncStatus = "FAILED";
        this.lastErrorCode = truncate(code, 64);
        this.lastErrorMessage = truncate(message, 512);
        this.nextAttemptAt = null;
    }

    public String getPlatformCode() { return platformCode; }
    public String getNextCursor() { return nextCursor; }
    public Instant getLastSnapshotAt() { return lastSnapshotAt; }
    public String getLastSyncStatus() { return lastSyncStatus; }
    public Instant getLastSuccessAt() { return lastSuccessAt; }
    public String getLastErrorCode() { return lastErrorCode; }
    public String getLastSourceWatermark() { return lastSourceWatermark; }
    public Instant getNextAttemptAt() { return nextAttemptAt; }
    public boolean canAttemptAt(Instant at) { return nextAttemptAt == null || !nextAttemptAt.isAfter(at); }
    private static String truncate(String value, int length) { return value == null ? null : value.substring(0, Math.min(value.length(), length)); }
}
