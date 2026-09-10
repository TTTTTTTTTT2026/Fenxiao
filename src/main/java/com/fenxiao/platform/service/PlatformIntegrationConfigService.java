package com.fenxiao.platform.service;

import com.fenxiao.platform.dto.PlatformIntegrationResponse;
import com.fenxiao.platform.repository.PlatformIntegrationConfigRepository;
import com.fenxiao.platform.repository.PlatformTargetGuildRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PlatformIntegrationConfigService {
    private final PlatformIntegrationConfigRepository platforms;
    private final PlatformTargetGuildRepository targetGuilds;

    public PlatformIntegrationConfigService(PlatformIntegrationConfigRepository platforms,
                                            PlatformTargetGuildRepository targetGuilds) {
        this.platforms = platforms;
        this.targetGuilds = targetGuilds;
    }

    @Transactional(readOnly = true)
    public List<PlatformIntegrationResponse> list() {
        return platforms.findAllByOrderByPlatformCodeAsc().stream().map(platform -> new PlatformIntegrationResponse(
                platform.getPlatformCode(), platform.getDisplayName(), platform.getPrimaryAccountIdentifier(),
                platform.getAccountIdentifierNote(), platform.getMcnIntegrationStatus(),
                platform.getRevenueIngestionMode(), platform.getRewardMode(), platform.isEnabled(),
                targetGuilds.findByPlatformCodeOrderByCountryCodeAscOfficialGuildIdAsc(platform.getPlatformCode()).stream()
                        .map(guild -> new PlatformIntegrationResponse.TargetGuild(guild.getCountryCode(), guild.getOfficialGuildId(),
                                guild.getOfficialGuildSid(), guild.getGuildName(), guild.isEnabled()))
                        .toList())).toList();
    }
}
