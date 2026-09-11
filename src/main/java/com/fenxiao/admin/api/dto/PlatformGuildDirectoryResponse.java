package com.fenxiao.admin.api.dto;

import com.fenxiao.platform.entity.PlatformGuildDirectory;
import com.fenxiao.platform.entity.PlatformGuildSyncRun;
import java.time.LocalDateTime;

public record PlatformGuildDirectoryResponse(String platformCode, String guildId, String guildName,
                                             String guildStatus, String directoryStatus,
                                             LocalDateTime officialUpdatedAt, LocalDateTime lastSeenAt,
                                             String sourceVersion, String joinInstruction, LocalDateTime missingSince) {
    public static PlatformGuildDirectoryResponse from(PlatformGuildDirectory value) {
        return new PlatformGuildDirectoryResponse(value.getPlatformCode(), value.getExternalGuildId(), value.getGuildName(),
                value.getGuildStatus(), value.getDirectoryStatus(), value.getOfficialUpdatedAt(), value.getLastSeenAt(),
                value.getSourceVersion(), value.getJoinInstruction(), value.getMissingSince());
    }
    public record SyncRun(String runId, String platformCode, String syncStatus, boolean snapshotComplete,
                          int receivedCount, int upsertedCount, int missingCount, String sourceVersion,
                          LocalDateTime startedAt, LocalDateTime completedAt, String errorCode, String errorMessage) {
        public static SyncRun from(PlatformGuildSyncRun value) {
            return new SyncRun(value.getRunId(), value.getPlatformCode(), value.getSyncStatus(), value.isSnapshotComplete(),
                    value.getReceivedCount(), value.getUpsertedCount(), value.getMissingCount(), value.getSourceVersion(),
                    value.getStartedAt(), value.getCompletedAt(), value.getErrorCode(), value.getErrorMessage());
        }
    }
}
