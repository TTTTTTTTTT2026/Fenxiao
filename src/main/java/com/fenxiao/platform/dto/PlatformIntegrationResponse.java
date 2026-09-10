package com.fenxiao.platform.dto;

import java.util.List;

public record PlatformIntegrationResponse(
        String platformCode,
        String displayName,
        String primaryAccountIdentifier,
        String accountIdentifierNote,
        String mcnIntegrationStatus,
        String revenueIngestionMode,
        String rewardMode,
        boolean enabled,
        List<TargetGuild> targetGuilds) {
    public record TargetGuild(String countryCode, String officialGuildId, String officialGuildSid,
                              String guildName, boolean enabled) {}
}
