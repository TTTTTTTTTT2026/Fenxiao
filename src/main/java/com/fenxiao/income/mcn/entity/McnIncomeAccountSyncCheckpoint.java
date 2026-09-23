package com.fenxiao.income.mcn.entity;

import com.fenxiao.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;

/** Per-platform-account income sync progress; account scopes never share a continuation position. */
@Entity
@Table(name = "mcn_income_account_sync_checkpoint")
public class McnIncomeAccountSyncCheckpoint extends BaseEntity {
    @Id @Column(name = "checkpoint_key", length = 112) private String id;
    @Column(name = "platform_code", nullable = false, length = 16) private String platformCode;
    @Column(name = "platform_user_id", nullable = false, length = 64) private String platformUserId;
    @Column(name = "next_cursor", length = 2048) private String nextCursor;
    @Column(name = "last_snapshot_at") private Instant lastSnapshotAt;
    @Lob @Column(name = "last_source_watermark", columnDefinition = "LONGTEXT") private String lastSourceWatermark;
    @Column(name = "last_sync_status", nullable = false, length = 32) private String lastSyncStatus;
    @Column(name = "last_success_at") private Instant lastSuccessAt;
    @Column(name = "next_attempt_at") private Instant nextAttemptAt;
    @Column(name = "last_error_code", length = 64) private String lastErrorCode;
    @Column(name = "last_error_message", length = 512) private String lastErrorMessage;
    @Column(name = "history_start") private LocalDate historyStart;
    @Column(name = "history_coverage_status", nullable = false, length = 16) private String historyCoverageStatus;
    @Column(name = "recovery_stage", length = 32) private String recoveryStage;
    @Column(name = "recovery_from") private LocalDate recoveryFrom;
    @Column(name = "recovery_to") private LocalDate recoveryTo;
    @Column(name = "recovery_window_end") private LocalDate recoveryWindowEnd;
    @Column(name = "recovery_cursor", length = 2048) private String recoveryCursor;

    protected McnIncomeAccountSyncCheckpoint() { }

    public static String key(String platformCode, String platformUserId) {
        return platformCode + ":" + platformUserId;
    }

    public static McnIncomeAccountSyncCheckpoint initial(String platformCode, String platformUserId) {
        McnIncomeAccountSyncCheckpoint value = new McnIncomeAccountSyncCheckpoint();
        value.id = key(platformCode, platformUserId);
        value.platformCode = platformCode;
        value.platformUserId = platformUserId;
        value.lastSyncStatus = "NEVER_RUN";
        value.historyCoverageStatus = "UNKNOWN";
        return value;
    }

    /** A platform guild join or local binding date is not an authoritative account lifecycle start. */
    public void recordHistoryStart(LocalDate historyStart, LocalDate authoritativeAccountStart) {
        if (historyStart == null) throw new IllegalArgumentException("MCN historyStart is required");
        this.historyStart = historyStart;
        this.historyCoverageStatus = authoritativeAccountStart == null ? "UNKNOWN"
                : authoritativeAccountStart.isBefore(historyStart) ? "PARTIAL" : "COMPLETE";
    }

    public void advance(String nextCursor, Instant snapshotAt, String watermark, Instant at) {
        this.nextCursor = nextCursor; this.lastSnapshotAt = snapshotAt; this.lastSourceWatermark = watermark;
        this.lastSyncStatus = "SUCCESS"; this.lastSuccessAt = at; this.nextAttemptAt = null;
        this.lastErrorCode = null; this.lastErrorMessage = null;
    }

    public void defer(String status, String watermark, Instant nextAttemptAt) {
        this.lastSyncStatus = status; this.lastSourceWatermark = watermark; this.nextAttemptAt = nextAttemptAt;
        this.lastErrorCode = null; this.lastErrorMessage = null;
    }

    public void fail(String code, String message, Instant nextAttemptAt) {
        this.lastSyncStatus = "FAILED"; this.lastErrorCode = truncate(code, 64);
        this.lastErrorMessage = truncate(message, 512); this.nextAttemptAt = nextAttemptAt;
    }

    public void beginRecovery(LocalDate from, LocalDate to) {
        if (from == null || to == null || to.isBefore(from)) throw new IllegalArgumentException("recovery dates are invalid");
        this.nextCursor = null; // Expired undated positions must never be retried.
        this.recoveryStage = "WINDOW_READ";
        this.recoveryFrom = from; this.recoveryTo = to;
        this.recoveryWindowEnd = min(from.plusDays(30), to);
        this.recoveryCursor = null;
        this.lastSyncStatus = "RECOVERING";
        this.nextAttemptAt = null;
    }

    public void blockRecovery(String message) {
        this.nextCursor = null;
        this.recoveryStage = "BLOCKED";
        fail("HISTORY_START_UNKNOWN", message, null);
    }

    public void acceptRecoveryPage(String cursor, boolean hasMore, Instant snapshotAt, String watermark, Instant at) {
        this.recoveryCursor = cursor;
        this.lastSnapshotAt = snapshotAt; this.lastSourceWatermark = watermark; this.lastSuccessAt = at;
        this.recoveryStage = hasMore ? "WINDOW_READ" : "WINDOW_RECONCILE";
        this.lastSyncStatus = "RECOVERING";
        this.nextAttemptAt = null;
    }

    public void replayRecoveryWindow() {
        this.recoveryCursor = null;
        this.recoveryStage = "WINDOW_READ";
        this.lastSyncStatus = "RECOVERING";
    }

    public void finishRecoveryWindow() {
        LocalDate next = recoveryWindowEnd.plusDays(1);
        this.recoveryCursor = null;
        if (next.isAfter(recoveryTo)) {
            this.recoveryStage = "STREAM_RESTART";
            this.recoveryFrom = null; this.recoveryTo = null; this.recoveryWindowEnd = null;
        } else {
            this.recoveryFrom = next;
            this.recoveryWindowEnd = min(next.plusDays(30), recoveryTo);
            this.recoveryStage = "WINDOW_READ";
        }
        this.lastSyncStatus = "RECOVERING";
    }

    public void finishStreamRestart() {
        this.recoveryStage = null; this.recoveryCursor = null;
        this.recoveryFrom = null; this.recoveryTo = null; this.recoveryWindowEnd = null;
    }

    private static LocalDate min(LocalDate left, LocalDate right) { return left.isBefore(right) ? left : right; }

    public boolean canAttemptAt(Instant at) { return nextAttemptAt == null || !nextAttemptAt.isAfter(at); }
    public String getId() { return id; }
    public String getPlatformCode() { return platformCode; }
    public String getPlatformUserId() { return platformUserId; }
    public String getNextCursor() { return nextCursor; }
    public Instant getLastSnapshotAt() { return lastSnapshotAt; }
    public String getLastSourceWatermark() { return lastSourceWatermark; }
    public String getLastSyncStatus() { return lastSyncStatus; }
    public Instant getLastSuccessAt() { return lastSuccessAt; }
    public Instant getNextAttemptAt() { return nextAttemptAt; }
    public String getLastErrorCode() { return lastErrorCode; }
    public LocalDate getHistoryStart() { return historyStart; }
    public String getHistoryCoverageStatus() { return historyCoverageStatus; }
    public String getRecoveryStage() { return recoveryStage; }
    public LocalDate getRecoveryFrom() { return recoveryFrom; }
    public LocalDate getRecoveryTo() { return recoveryTo; }
    public LocalDate getRecoveryWindowEnd() { return recoveryWindowEnd; }
    public String getRecoveryCursor() { return recoveryCursor; }
    private static String truncate(String value, int length) { return value == null ? null : value.substring(0, Math.min(value.length(), length)); }
}
