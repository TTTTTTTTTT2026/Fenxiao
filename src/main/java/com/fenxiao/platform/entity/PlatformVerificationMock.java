package com.fenxiao.platform.entity;

import com.fenxiao.common.entity.BaseEntity;
import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.Locale;

@Entity
@Table(name = "platform_verification_mock")
public class PlatformVerificationMock extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "platform_code", nullable = false, length = 32)
    private String platformCode;
    @Column(name = "platform_user_id", nullable = false, length = 64)
    private String platformUserId;
    @Column(name = "globally_seen_before_submission", nullable = false)
    private boolean globallySeenBeforeSubmission;
    @Column(name = "joined_target_guild", nullable = false)
    private boolean joinedTargetGuild;
    @Column(name = "official_guild_id", nullable = false, length = 64)
    private String officialGuildId;
    @Column(name = "official_joined_at", nullable = false)
    private LocalDateTime officialJoinedAt;
    @Column(name = "source_reference", length = 128)
    private String sourceReference;
    @Column(name = "enabled", nullable = false)
    private boolean enabled;

    protected PlatformVerificationMock() {}

    public static PlatformVerificationMock create(String platformCode, String platformUserId,
                                                  boolean globallySeenBeforeSubmission, boolean joinedTargetGuild,
                                                  String officialGuildId, LocalDateTime officialJoinedAt,
                                                  String sourceReference, boolean enabled) {
        PlatformVerificationMock value = new PlatformVerificationMock();
        value.apply(platformCode, platformUserId, globallySeenBeforeSubmission, joinedTargetGuild,
                officialGuildId, officialJoinedAt, sourceReference, enabled);
        return value;
    }

    public void update(boolean globallySeenBeforeSubmission, boolean joinedTargetGuild,
                       String officialGuildId, LocalDateTime officialJoinedAt,
                       String sourceReference, boolean enabled) {
        apply(platformCode, platformUserId, globallySeenBeforeSubmission, joinedTargetGuild,
                officialGuildId, officialJoinedAt, sourceReference, enabled);
    }

    private void apply(String platformCode, String platformUserId, boolean globallySeenBeforeSubmission,
                       boolean joinedTargetGuild, String officialGuildId, LocalDateTime officialJoinedAt,
                       String sourceReference, boolean enabled) {
        this.platformCode = required(platformCode, "platform code").toUpperCase(Locale.ROOT);
        this.platformUserId = required(platformUserId, "platform user id");
        this.globallySeenBeforeSubmission = globallySeenBeforeSubmission;
        this.joinedTargetGuild = joinedTargetGuild;
        this.officialGuildId = required(officialGuildId, "official guild id");
        if (officialJoinedAt == null) throw new IllegalArgumentException("official joined at is required");
        this.officialJoinedAt = officialJoinedAt;
        this.sourceReference = trimToNull(sourceReference);
        this.enabled = enabled;
    }

    private static String required(String value, String label) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException(label + " is required");
        return value.trim();
    }
    private static String trimToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }

    public Long getId() { return id; }
    public String getPlatformCode() { return platformCode; }
    public String getPlatformUserId() { return platformUserId; }
    public boolean isGloballySeenBeforeSubmission() { return globallySeenBeforeSubmission; }
    public boolean isJoinedTargetGuild() { return joinedTargetGuild; }
    public String getOfficialGuildId() { return officialGuildId; }
    public LocalDateTime getOfficialJoinedAt() { return officialJoinedAt; }
    public String getSourceReference() { return sourceReference; }
    public boolean isEnabled() { return enabled; }
}
