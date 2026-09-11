package com.fenxiao.platform.entity;

import com.fenxiao.common.entity.BaseEntity;
import com.fenxiao.platform.service.McnGuildDirectorySnapshot;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "platform_guild_sync_run", uniqueConstraints = @UniqueConstraint(name = "uk_platform_guild_sync_run", columnNames = {"run_id", "platform_code"}))
public class PlatformGuildSyncRun extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "run_id", nullable = false, length = 64) private String runId;
    @Column(name = "platform_code", nullable = false, length = 32) private String platformCode;
    @Column(name = "sync_status", nullable = false, length = 32) private String syncStatus;
    @Column(name = "snapshot_complete", nullable = false) private boolean snapshotComplete;
    @Column(name = "received_count", nullable = false) private int receivedCount;
    @Column(name = "upserted_count", nullable = false) private int upsertedCount;
    @Column(name = "missing_count", nullable = false) private int missingCount;
    @Column(name = "source_version", length = 128) private String sourceVersion;
    @Column(name = "directory_scope", length = 64) private String directoryScope;
    @Column(name = "snapshot_id", length = 255) private String snapshotId;
    @Column(name = "snapshot_checksum", length = 255) private String snapshotChecksum;
    @Column(name = "snapshot_at") private LocalDateTime snapshotAt;
    @Column(name = "snapshot_expires_at") private LocalDateTime snapshotExpiresAt;
    @Column(name = "started_at", nullable = false) private LocalDateTime startedAt;
    @Column(name = "completed_at") private LocalDateTime completedAt;
    @Column(name = "error_code", length = 128) private String errorCode;
    @Column(name = "error_message", length = 512) private String errorMessage;
    protected PlatformGuildSyncRun() {}
    public static PlatformGuildSyncRun completed(String runId, McnGuildDirectorySnapshot snapshot, int received, int upserted, int missing, LocalDateTime now) {
        PlatformGuildSyncRun value = new PlatformGuildSyncRun(); value.runId = runId; value.platformCode = snapshot.platformCode();
        value.syncStatus = "SUCCESS"; value.snapshotComplete = true; value.receivedCount = received; value.upsertedCount = upserted;
        value.missingCount = missing; value.sourceVersion = snapshot.snapshotVersion(); value.directoryScope = snapshot.directoryScope();
        value.snapshotId = snapshot.snapshotId(); value.snapshotChecksum = snapshot.snapshotChecksum(); value.snapshotAt = snapshot.snapshotAt(); value.snapshotExpiresAt = snapshot.snapshotExpiresAt();
        value.startedAt = now; value.completedAt = now; return value;
    }
    public static PlatformGuildSyncRun failed(String runId, String platform, String errorCode, String errorMessage, LocalDateTime now) {
        PlatformGuildSyncRun value = new PlatformGuildSyncRun(); value.runId = runId; value.platformCode = platform;
        value.syncStatus = "FAILED"; value.snapshotComplete = false; value.receivedCount = 0; value.upsertedCount = 0;
        value.missingCount = 0; value.startedAt = now; value.completedAt = now; value.errorCode = errorCode;
        value.errorMessage = errorMessage == null ? null : errorMessage.substring(0, Math.min(errorMessage.length(), 512)); return value;
    }
    public Long getId() { return id; } public String getRunId() { return runId; } public String getPlatformCode() { return platformCode; }
    public String getSyncStatus() { return syncStatus; } public boolean isSnapshotComplete() { return snapshotComplete; }
    public int getReceivedCount() { return receivedCount; } public int getUpsertedCount() { return upsertedCount; } public int getMissingCount() { return missingCount; }
    public String getSourceVersion() { return sourceVersion; } public LocalDateTime getStartedAt() { return startedAt; } public LocalDateTime getCompletedAt() { return completedAt; }
    public String getErrorCode() { return errorCode; } public String getErrorMessage() { return errorMessage; }
}
