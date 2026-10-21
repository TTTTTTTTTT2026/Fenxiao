package com.fenxiao.platform.service;

import com.fenxiao.platform.repository.PlatformGuildDirectoryRepository;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Map;

@Service
public class McnTimoGuildScopeResolver {
    private static final Map<String, String> MCN_COUNTRIES = Map.of(
            "MX", "Mexico",
            "ID", "Indonesia",
            "BR", "Brazil");
    private final TimoGuildCountryAccessService countryAccess;
    private final PlatformGuildDirectoryRepository directory;

    public McnTimoGuildScopeResolver(TimoGuildCountryAccessService countryAccess, PlatformGuildDirectoryRepository directory) {
        this.countryAccess = countryAccess;
        this.directory = directory;
    }

    public ResolvedGuildScope resolve(String platformCode, String countryCode) {
        String platform = platformCode.trim().toUpperCase(Locale.ROOT);
        String country = countryCode.trim().toUpperCase(Locale.ROOT);
        if (!"TIMO".equals(platform)) throw new IllegalArgumentException("MCN guild scope is only defined for TIMO");
        var target = countryAccess.bindingTarget(country)
                .orElseThrow(() -> new IllegalStateException("no enabled Timo target guild exists for " + country));
        var guild = directory.findByPlatformCodeAndExternalGuildId("TIMO", target.guildId());
        if (guild.isPresent()) {
            TimoGuildCountryAccessService.requireUsable(guild.get());
            String mcnCountry = guild.get().getCountry();
            if (mcnCountry == null || mcnCountry.isBlank()) throw new IllegalStateException("MCN Timo guild country is missing");
            return new ResolvedGuildScope(target.guildId(), canonicalMcnCountry(mcnCountry));
        }
        // Preserve only the old three-country behavior before its first MCN directory arrives.
        String legacyCountry = target.legacyCountry() == null ? null : MCN_COUNTRIES.get(target.legacyCountry());
        if (legacyCountry == null) throw new IllegalStateException("configured Timo guild is missing from the MCN directory");
        return new ResolvedGuildScope(target.guildId(), legacyCountry);
    }

    private String canonicalMcnCountry(String country) {
        return switch (country.trim().toUpperCase(Locale.ROOT)) {
            case "MX", "MEXICO" -> "Mexico";
            case "BR", "BRAZIL" -> "Brazil";
            case "ID", "INDONESIA" -> "Indonesia";
            default -> country.trim();
        };
    }

    public record ResolvedGuildScope(String officialGuildId, String mcnCountry) {}
}
