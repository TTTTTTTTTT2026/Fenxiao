package com.fenxiao.platform.service;

import com.fenxiao.platform.entity.McnGuildDirectoryItem;
import java.util.List;

/** A snapshot may mark prior guilds missing only when MCN confirms it is complete for one platform. */
public record McnGuildDirectorySnapshot(String platformCode, boolean complete, String directoryScope,
                                       String snapshotId, String snapshotVersion, String snapshotChecksum,
                                       java.time.LocalDateTime snapshotAt, java.time.LocalDateTime snapshotExpiresAt,
                                       List<McnGuildDirectoryItem> items) {}
