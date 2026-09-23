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

    /** V2 keeps continuation positions per account; this legacy row is only a platform summary. */
    public void recordAccountScopedSuccess(Instant snapshotAt, String sourceWatermark, Instant at) {
        advance(null, snapshotAt, sourceWatermark, at);
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

    /** A 410 cursor expiry is a configuration recovery state, not a transient transport failure. */
    public void cursorExpired(String message) {
        this.lastSyncStatus = "CURSOR_EXPIRED";
        this.lastErrorCode = "HTTP_410_CURSOR_EXPIRED";
        this.lastErrorMessage = truncate(message, 512);
        this.nextAttemptAt = null;
    }

    /** Keeps the expired cursor for audit while an authorised date-bounded probe is performed. */
    public void recoveryProbePassed() {
        this.lastSyncStatus = "RECOVERY_PROBE_PASSED";
        this.lastErrorCode = null;
        this.lastErrorMessage = null;
        this.nextAttemptAt = null;
    }

    /** Starts a fresh, unbounded revision stream only after a successful bounded FINAL probe. */
    public void resumeFromBeginning() {
        if (!"RECOVERY_PROBE_PASSED".equals(lastSyncStatus)) {
            throw new IllegalStateException("a successful date-bounded FINAL probe is required before cursor recovery");
        }
        this.nextCursor = null;
        this.lastSyncStatus = "RECOVERY_RESUMED";
        this.lastErrorCode = null;
        this.lastErrorMessage = null;
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
    public boolean isCursorRecoveryPaused() { return "CURSOR_EXPIRED".equals(lastSyncStatus) || "RECOVERY_PROBE_PASSED".equals(lastSyncStatus); }
    public boolean canAttemptAt(Instant at) { return !isCursorRecoveryPaused() && (nextAttemptAt == null || !nextAttemptAt.isAfter(at)); }
    private static String truncate(String value, int length) { return value == null ? null : value.substring(0, Math.min(value.length(), length)); }
}
