package com.fenxiao.platform.entity;

import com.fenxiao.common.entity.BaseEntity;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "platform_guild_directory", uniqueConstraints = @UniqueConstraint(name = "uk_platform_guild_directory", columnNames = {"platform_code", "external_guild_id"}))
public class PlatformGuildDirectory extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "platform_code", nullable = false, length = 32) private String platformCode;
    @Column(name = "external_guild_id", nullable = false, length = 64) private String externalGuildId;
    @Column(name = "guild_name", nullable = false, length = 128) private String guildName;
    @Column(name = "guild_status", nullable = false, length = 32) private String guildStatus;
    @Column(name = "country", length = 64) private String country;
    @Column(name = "directory_status", nullable = false, length = 32) private String directoryStatus;
    @Column(name = "mcn_record_updated_at") private LocalDateTime mcnRecordUpdatedAt;
    @Column(name = "official_updated_at") private LocalDateTime officialUpdatedAt;
    @Column(name = "last_seen_at", nullable = false) private LocalDateTime lastSeenAt;
    @Column(name = "last_sync_run_id", nullable = false, length = 64) private String lastSyncRunId;
    @Column(name = "source_version", length = 128) private String sourceVersion;
    @Column(name = "join_instruction", length = 255) private String joinInstruction;
    @Column(name = "missing_since") private LocalDateTime missingSince;
    protected PlatformGuildDirectory() {}
    public static PlatformGuildDirectory seen(String platform, McnGuildDirectoryItem item, String runId, LocalDateTime now) {
        PlatformGuildDirectory value = new PlatformGuildDirectory();
        value.platformCode = platform; value.externalGuildId = item.guildId(); value.apply(item, runId, now); return value;
    }
    public void apply(McnGuildDirectoryItem item, String runId, LocalDateTime now) {
        guildName = item.guildName(); guildStatus = item.guildStatus(); country = item.country(); directoryStatus = "NORMAL";
        mcnRecordUpdatedAt = item.recordUpdatedAt();
        officialUpdatedAt = item.officialUpdatedAt(); lastSeenAt = now; lastSyncRunId = runId;
        sourceVersion = item.sourceVersion(); joinInstruction = item.joinInstruction(); missingSince = null;
    }
    public void markMissing(LocalDateTime now) { directoryStatus = "MISSING_ON_MCN"; if (missingSince == null) missingSince = now; }
    public Long getId() { return id; } public String getPlatformCode() { return platformCode; }
    public String getExternalGuildId() { return externalGuildId; } public String getGuildName() { return guildName; }
    public String getGuildStatus() { return guildStatus; } public String getDirectoryStatus() { return directoryStatus; }
    public String getCountry() { return country; } public LocalDateTime getMcnRecordUpdatedAt() { return mcnRecordUpdatedAt; }
    public LocalDateTime getOfficialUpdatedAt() { return officialUpdatedAt; } public LocalDateTime getLastSeenAt() { return lastSeenAt; }
    public String getLastSyncRunId() { return lastSyncRunId; } public String getSourceVersion() { return sourceVersion; }
    public String getJoinInstruction() { return joinInstruction; } public LocalDateTime getMissingSince() { return missingSince; }
}
