package com.fenxiao.platform.repository;

import com.fenxiao.platform.entity.PlatformTargetGuild;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PlatformTargetGuildRepository extends JpaRepository<PlatformTargetGuild, Long> {
    List<PlatformTargetGuild> findByPlatformCodeOrderByCountryCodeAscOfficialGuildIdAsc(String platformCode);

    Optional<PlatformTargetGuild> findByPlatformCodeAndCountryCodeAndEnabledTrue(String platformCode, String countryCode);

    boolean existsByPlatformCodeAndCountryCodeAndOfficialGuildId(String platformCode, String countryCode, String officialGuildId);

    default void saveIfMissing(String platformCode, String countryCode, String officialGuildId, String guildName) {
        if (!existsByPlatformCodeAndCountryCodeAndOfficialGuildId(platformCode, countryCode, officialGuildId)) {
            save(PlatformTargetGuild.create(platformCode, countryCode, officialGuildId, null, guildName, true));
        }
    }
}
