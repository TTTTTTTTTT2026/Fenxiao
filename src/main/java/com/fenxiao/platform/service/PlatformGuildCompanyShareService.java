package com.fenxiao.platform.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/** Immutable-at-calculation-time company-share evidence for invitation commission V2. */
@Service
@Transactional
public class PlatformGuildCompanyShareService {
    private final JdbcTemplate jdbc;
    private final Clock clock;

    public PlatformGuildCompanyShareService(JdbcTemplate jdbc, Clock clock) {
        this.jdbc = jdbc;
        this.clock = clock;
    }

    public void replaceCurrentRate(String platformCode, String guildId, BigDecimal rate, Long actorId) {
        String platform = platform(platformCode);
        String guild = required(guildId, "guildId");
        if (rate == null || rate.compareTo(BigDecimal.ZERO) < 0 || rate.compareTo(BigDecimal.ONE) > 0) {
            throw new IllegalArgumentException("company share rate must be between 0 and 1");
        }
        LocalDateTime now = LocalDateTime.now(clock);
        jdbc.update("update platform_guild_company_share_version set effective_to=? where platform_code=? and guild_id=? and effective_to is null", now, platform, guild);
        jdbc.update("insert into platform_guild_company_share_version(platform_code,guild_id,share_rate,effective_from,configured_by) values(?,?,?,?,?)",
                platform, guild, rate, now, actorId);
    }

    @Transactional(readOnly = true)
    public Optional<BigDecimal> findEffective(String platformCode, String guildId, LocalDateTime occurredAt) {
        if (guildId == null || guildId.isBlank()) return Optional.empty();
        List<BigDecimal> rows = jdbc.query("select share_rate from platform_guild_company_share_version where platform_code=? and guild_id=? and effective_from<=? and (effective_to is null or effective_to>?) order by effective_from desc,id desc limit 1",
                (rs, row) -> rs.getBigDecimal(1), platform(platformCode), guildId.trim(), occurredAt, occurredAt);
        return rows.stream().findFirst();
    }

    private String platform(String value) {
        String result = required(value, "platformCode").toUpperCase(Locale.ROOT);
        if (!"TIMO".equals(result) && !"LINKY".equals(result)) throw new IllegalArgumentException("unsupported platform");
        return result;
    }
    private String required(String value, String field) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException(field + " is required");
        return value.trim();
    }
}
