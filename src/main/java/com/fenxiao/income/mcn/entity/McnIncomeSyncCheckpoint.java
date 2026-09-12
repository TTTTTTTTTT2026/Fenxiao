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
    }

    public void markStale(String sourceWatermark) {
        this.lastSyncStatus = "STALE";
        this.lastSourceWatermark = sourceWatermark;
    }

    public void fail(String code, String message) {
        this.lastSyncStatus = "FAILED";
        this.lastErrorCode = truncate(code, 64);
        this.lastErrorMessage = truncate(message, 512);
    }

    public String getPlatformCode() { return platformCode; }
    public String getNextCursor() { return nextCursor; }
    private static String truncate(String value, int length) { return value == null ? null : value.substring(0, Math.min(value.length(), length)); }
}
