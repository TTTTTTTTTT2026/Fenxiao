package com.fenxiao.platform.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "platform_target_guild")
public class PlatformTargetGuild {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "platform_code", nullable = false, length = 32)
    private String platformCode;
    @Column(name = "country_code", nullable = false, length = 10)
    private String countryCode;
    @Column(name = "official_guild_id", nullable = false, length = 64)
    private String officialGuildId;
    @Column(name = "official_guild_sid", length = 64)
    private String officialGuildSid;
    @Column(name = "guild_name", nullable = false, length = 128)
    private String guildName;
    @Column(name = "enabled", nullable = false)
    private boolean enabled;
    /** The platform-token share retained by this guild before its operating profit is distributed. */
    @Column(name = "operating_share_rate", precision = 8, scale = 6)
    private BigDecimal operatingShareRate;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    protected PlatformTargetGuild() {}

    public Long getId() { return id; }
    public String getPlatformCode() { return platformCode; }
    public String getCountryCode() { return countryCode; }
    public String getOfficialGuildId() { return officialGuildId; }
    public String getOfficialGuildSid() { return officialGuildSid; }
    public String getGuildName() { return guildName; }
    public boolean isEnabled() { return enabled; }
    public BigDecimal getOperatingShareRate() { return operatingShareRate; }

    public void setOperatingShareRate(BigDecimal operatingShareRate) { this.operatingShareRate = operatingShareRate; }

    @PrePersist void onCreate() { LocalDateTime now = LocalDateTime.now(); if (createdAt == null) createdAt = now; updatedAt = now; }
    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }

    public static PlatformTargetGuild create(String platformCode, String countryCode, String officialGuildId,
                                             String officialGuildSid, String guildName, boolean enabled) {
        PlatformTargetGuild value = new PlatformTargetGuild();
        value.platformCode = platformCode;
        value.countryCode = countryCode;
        value.officialGuildId = officialGuildId;
        value.officialGuildSid = officialGuildSid;
        value.guildName = guildName;
        value.enabled = enabled;
        return value;
    }
}
