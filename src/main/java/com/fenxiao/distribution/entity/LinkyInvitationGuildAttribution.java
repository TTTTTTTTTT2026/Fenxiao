package com.fenxiao.distribution.entity;

import com.fenxiao.distribution.domain.LinkyInvitationGuildSource;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "linky_invitation_guild_attribution")
public class LinkyInvitationGuildAttribution {
    @Id
    @Column(name = "user_id", nullable = false)
    private Long userId;
    @Column(name = "guild_id", nullable = false, length = 64)
    private String guildId;
    @Column(name = "guild_name", nullable = false, length = 128)
    private String guildName;
    @Column(name = "guild_invite_code", length = 64)
    private String guildInviteCode;
    @Enumerated(EnumType.STRING)
    @Column(name = "attribution_source", nullable = false, length = 32)
    private LinkyInvitationGuildSource attributionSource;
    @Column(name = "inherited_from_user_id")
    private Long inheritedFromUserId;
    @Column(name = "effective_at", nullable = false)
    private LocalDateTime effectiveAt;
    @Column(name = "changed_by")
    private Long changedBy;
    @Column(name = "change_reason", length = 255)
    private String changeReason;
    @Column(name = "version_no", nullable = false)
    private int versionNo;

    protected LinkyInvitationGuildAttribution() {}

    public static LinkyInvitationGuildAttribution create(Long userId, String guildId, String guildName, String guildInviteCode,
                                                          LinkyInvitationGuildSource source, Long inheritedFromUserId,
                                                          Long changedBy, String reason, LocalDateTime at) {
        LinkyInvitationGuildAttribution value = new LinkyInvitationGuildAttribution();
        value.userId = userId;
        value.versionNo = 0;
        value.replace(guildId, guildName, guildInviteCode, source, inheritedFromUserId, changedBy, reason, at);
        return value;
    }

    public void replace(String guildId, String guildName, String guildInviteCode, LinkyInvitationGuildSource source,
                        Long inheritedFromUserId, Long changedBy, String reason, LocalDateTime at) {
        this.guildId = required(guildId, "guild id");
        this.guildName = required(guildName, "guild name");
        this.guildInviteCode = trimToNull(guildInviteCode);
        this.attributionSource = source;
        this.inheritedFromUserId = inheritedFromUserId;
        this.changedBy = changedBy;
        this.changeReason = trimToNull(reason);
        this.effectiveAt = at;
        this.versionNo++;
    }

    public Long getUserId() { return userId; }
    public String getGuildId() { return guildId; }
    public String getGuildName() { return guildName; }
    public String getGuildInviteCode() { return guildInviteCode; }
    public LinkyInvitationGuildSource getAttributionSource() { return attributionSource; }
    public Long getInheritedFromUserId() { return inheritedFromUserId; }
    public LocalDateTime getEffectiveAt() { return effectiveAt; }
    public Long getChangedBy() { return changedBy; }
    public String getChangeReason() { return changeReason; }
    public int getVersionNo() { return versionNo; }

    private static String required(String value, String name) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException(name + " is required");
        return value.trim();
    }
    private static String trimToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
