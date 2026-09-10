package com.fenxiao.platform.service;

import com.fenxiao.platform.entity.PlatformTargetGuild;
import com.fenxiao.platform.repository.PlatformTargetGuildRepository;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Map;

@Service
public class McnTimoGuildScopeResolver {
    private static final Map<String, String> MCN_COUNTRIES = Map.of(
            "MX", "Mexico",
            "ID", "Indonesia",
            "BR", "Brazil");
    private final PlatformTargetGuildRepository targetGuilds;

    public McnTimoGuildScopeResolver(PlatformTargetGuildRepository targetGuilds) {
        this.targetGuilds = targetGuilds;
    }

    public ResolvedGuildScope resolve(String platformCode, String countryCode) {
        String platform = platformCode.trim().toUpperCase(Locale.ROOT);
        String country = countryCode.trim().toUpperCase(Locale.ROOT);
        if (!"TIMO".equals(platform)) throw new IllegalArgumentException("MCN guild scope is only defined for TIMO");
        String mcnCountry = MCN_COUNTRIES.get(country);
        if (mcnCountry == null) throw new IllegalArgumentException("no MCN Timo country mapping exists for " + country);
        PlatformTargetGuild target = targetGuilds.findByPlatformCodeAndCountryCodeAndEnabledTrue(platform, country)
                .orElseThrow(() -> new IllegalStateException("no enabled Timo target guild exists for " + country));
        return new ResolvedGuildScope(target.getOfficialGuildId(), mcnCountry);
    }

    public record ResolvedGuildScope(String officialGuildId, String mcnCountry) {}
}
