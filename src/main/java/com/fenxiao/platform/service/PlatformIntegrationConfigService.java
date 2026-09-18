package com.fenxiao.platform.service;

import com.fenxiao.platform.dto.PlatformIntegrationResponse;
import com.fenxiao.platform.entity.PlatformGuildDirectory;
import com.fenxiao.platform.entity.PlatformTargetGuild;
import com.fenxiao.platform.repository.PlatformIntegrationConfigRepository;
import com.fenxiao.platform.repository.PlatformGuildDirectoryRepository;
import com.fenxiao.platform.repository.PlatformTargetGuildRepository;
import com.fenxiao.admin.service.AdminSessionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class PlatformIntegrationConfigService {
    private final PlatformIntegrationConfigRepository platforms;
    private final PlatformTargetGuildRepository targetGuilds;
    private final PlatformGuildDirectoryRepository authoritativeGuilds;
    private final PlatformGuildCompanyShareService companyShares;

    public PlatformIntegrationConfigService(PlatformIntegrationConfigRepository platforms,
                                            PlatformTargetGuildRepository targetGuilds,
                                            PlatformGuildDirectoryRepository authoritativeGuilds,
                                            PlatformGuildCompanyShareService companyShares) {
        this.platforms = platforms;
        this.targetGuilds = targetGuilds;
        this.authoritativeGuilds = authoritativeGuilds;
        this.companyShares = companyShares;
    }

    @Transactional(readOnly = true)
    public List<PlatformIntegrationResponse> list() {
        return platforms.findAllByOrderByPlatformCodeAsc().stream().map(platform -> new PlatformIntegrationResponse(
                platform.getPlatformCode(), platform.getDisplayName(), platform.getPrimaryAccountIdentifier(),
                platform.getAccountIdentifierNote(), platform.getMcnIntegrationStatus(),
                platform.getRevenueIngestionMode(), platform.getRewardMode(), platform.isEnabled(),
                guilds(platform.getPlatformCode()))).toList();
    }

    /** The MCN directory is the display authority. Target-guild rows only retain BANDEIRA business configuration. */
    private List<PlatformIntegrationResponse.TargetGuild> guilds(String platform) {
        Map<String, PlatformTargetGuild> configured = targetGuilds.findByPlatformCodeOrderByCountryCodeAscOfficialGuildIdAsc(platform).stream()
                .collect(Collectors.toMap(PlatformTargetGuild::getOfficialGuildId, Function.identity(), (first, ignored) -> first));
        List<PlatformIntegrationResponse.TargetGuild> result = new java.util.ArrayList<>(authoritativeGuilds.findByPlatformCodeOrderByExternalGuildIdAsc(platform).stream()
                .map(directory -> toResponse(directory, configured.remove(directory.getExternalGuildId())))
                .toList());
        // Keep old configured targets visible until their first authoritative directory snapshot arrives.
        configured.values().forEach(target -> result.add(new PlatformIntegrationResponse.TargetGuild(target.getCountryCode(),
                target.getOfficialGuildId(), target.getOfficialGuildSid(), target.getGuildName(), target.isEnabled(),
                false, "AWAITING_MCN_DIRECTORY", target.isEnabled() ? "ENABLED" : "DISABLED", target.getOperatingShareRate())));
        result.sort(java.util.Comparator.comparing(PlatformIntegrationResponse.TargetGuild::countryCode).thenComparing(PlatformIntegrationResponse.TargetGuild::officialGuildId));
        return List.copyOf(result);
    }

    @Transactional
    public PlatformIntegrationResponse.TargetGuild setOperatingShareRate(String platformCode, String guildId, java.math.BigDecimal rate, Long actorId) {
        String platform = platform(platformCode);
        PlatformGuildDirectory directory = authoritativeGuilds.findByPlatformCodeAndExternalGuildId(platform, required(guildId, "guildId"))
                .orElseThrow(() -> new IllegalArgumentException("guild is not present in the authoritative MCN directory"));
        if (!"NORMAL".equalsIgnoreCase(directory.getDirectoryStatus()) || !("ACTIVE".equalsIgnoreCase(directory.getGuildStatus()) || "ENABLED".equalsIgnoreCase(directory.getGuildStatus()))) {
            throw new IllegalArgumentException("only an active authoritative guild can have an operating share rate");
        }
        PlatformTargetGuild target = targetGuilds.findByPlatformCodeAndOfficialGuildId(platform, directory.getExternalGuildId())
                .orElseGet(() -> PlatformTargetGuild.create(platform, countryCode(directory.getCountry()), directory.getExternalGuildId(), null, directory.getGuildName(), true));
        target.setOperatingShareRate(rate);
        targetGuilds.save(target);
        companyShares.replaceCurrentRate(platform, directory.getExternalGuildId(), rate, actorId);
        return toResponse(directory, target);
    }

    private PlatformIntegrationResponse.TargetGuild toResponse(PlatformGuildDirectory directory, PlatformTargetGuild configured) {
        return new PlatformIntegrationResponse.TargetGuild(countryCode(directory.getCountry()), directory.getExternalGuildId(),
                configured == null ? null : configured.getOfficialGuildSid(), directory.getGuildName(),
                configured == null || configured.isEnabled(), true, directory.getDirectoryStatus(), directory.getGuildStatus(),
                configured == null ? null : configured.getOperatingShareRate());
    }

    private String countryCode(String country) {
        if (country == null || country.isBlank()) return "UNKNOWN";
        String normalized = country.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) { case "BRAZIL" -> "BR"; case "INDONESIA" -> "ID"; case "MEXICO" -> "MX"; default -> normalized; };
    }
    private String platform(String value) { String normalized = required(value, "platform").trim().toUpperCase(Locale.ROOT); if (!"LINKY".equals(normalized) && !"TIMO".equals(normalized)) throw new IllegalArgumentException("unsupported platform"); return normalized; }
    private String required(String value, String name) { if (value == null || value.isBlank()) throw new IllegalArgumentException(name + " is required"); return value; }
}
