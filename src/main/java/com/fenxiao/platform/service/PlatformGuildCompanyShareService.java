package com.fenxiao.platform.service;

import com.fenxiao.platform.dto.PlatformGuildCompanyShareRuleResponse;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/** Immutable-at-calculation-time company-share evidence for invitation commission V2. */
@Service
@Transactional
public class PlatformGuildCompanyShareService {
    private final JdbcTemplate jdbc;
    private final Clock clock;
    private final OperationAuditLogRepository auditLogs;

    public PlatformGuildCompanyShareService(JdbcTemplate jdbc, Clock clock, OperationAuditLogRepository auditLogs) {
        this.jdbc = jdbc;
        this.clock = clock;
        this.auditLogs = auditLogs;
    }

    /** Saves a new company-share version and makes it effective immediately, retaining the full change audit. */
    public PlatformGuildCompanyShareRuleResponse setImmediate(String platformCode, String guildId, BigDecimal rate, Long actorId) {
        String platform = platform(platformCode);
        String guild = required(guildId, "guildId");
        validateRate(rate);
        LocalDateTime now = LocalDateTime.now(clock);
        List<String> previousVersions = jdbc.query("select concat('id=',id,',v=',share_version,',rate=',share_rate,',from=',effective_from,',to=',coalesce(effective_to,'null'),',status=',rule_status) from platform_guild_company_share_version where platform_code=? and guild_id=? and (rule_status='DRAFT' or rule_status='ACTIVE') order by share_version",
                (rs, row) -> rs.getString(1), platform, guild);
        Integer nextVersion = jdbc.queryForObject("select coalesce(max(share_version),0)+1 from platform_guild_company_share_version where platform_code=? and guild_id=?", Integer.class, platform, guild);
        KeyHolder keys = new GeneratedKeyHolder();
        // Supersede any pending draft or future schedule, but keep their approved/audit history.
        jdbc.update("update platform_guild_company_share_version set rule_status='CANCELLED' where platform_code=? and guild_id=? and (rule_status='DRAFT' or (rule_status='ACTIVE' and effective_from>?))",
                platform, guild, now);
        // End the prior currently-effective interval at this save time; facts already recorded retain their snapshots.
        jdbc.update("update platform_guild_company_share_version set effective_to=? where platform_code=? and guild_id=? and rule_status='ACTIVE' and effective_from<=? and (effective_to is null or effective_to>?)",
                now, platform, guild, now, now);
        jdbc.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("insert into platform_guild_company_share_version(platform_code,guild_id,share_version,share_rate,effective_from,rule_status,configured_by) values(?,?,?,?,?,'ACTIVE',?)", new String[]{"id"});
            statement.setString(1, platform); statement.setString(2, guild); statement.setInt(3, Objects.requireNonNull(nextVersion));
            statement.setBigDecimal(4, rate); statement.setObject(5, now); statement.setLong(6, actorId);
            return statement;
        }, keys);
        long id = Objects.requireNonNull(keys.getKey()).longValue();
        auditLogs.save(OperationAuditLog.create(actorId, "FINANCE", "PLATFORM_GUILD_COMPANY_SHARE", "COMPANY_SHARE_RULE", id,
                "SET_IMMEDIATE", previousVersions.isEmpty() ? "no existing company-share version" : String.join(";", previousVersions),
                "status=ACTIVE;version=" + nextVersion + ";shareRate=" + rate + ";effectiveFrom=" + now, null,
                "Company share saved and effective immediately; prior schedules/drafts retained as cancelled history.", now));
        return requiredRule(id);
    }

    @Transactional(readOnly = true)
    public Optional<BigDecimal> findEffective(String platformCode, String guildId, LocalDateTime occurredAt) {
        if (guildId == null || guildId.isBlank()) return Optional.empty();
        List<BigDecimal> rows = jdbc.query("select share_rate from platform_guild_company_share_version where platform_code=? and guild_id=? and rule_status='ACTIVE' and effective_from<=? and (effective_to is null or effective_to>?) order by effective_from desc,id desc limit 1",
                (rs, row) -> rs.getBigDecimal(1), platform(platformCode), guildId.trim(), occurredAt, occurredAt);
        return rows.stream().findFirst();
    }

    @Transactional(readOnly = true)
    public List<PlatformGuildCompanyShareRuleResponse> history(String platformCode, String guildId) {
        return jdbc.query(select() + " where platform_code=? and guild_id=? order by effective_from desc,id desc", (rs, row) -> map(rs), platform(platformCode), required(guildId, "guildId"));
    }

    @Transactional(readOnly = true)
    public Map<String, PlatformGuildCompanyShareRuleResponse> latestDraftsByGuild(String platformCode) {
        List<PlatformGuildCompanyShareRuleResponse> drafts = jdbc.query(
                select() + " where platform_code=? and rule_status='DRAFT' order by id desc",
                (rs, row) -> map(rs), platform(platformCode));
        Map<String, PlatformGuildCompanyShareRuleResponse> latestByGuild = new LinkedHashMap<>();
        drafts.forEach(draft -> latestByGuild.putIfAbsent(draft.guildId(), draft));
        return Map.copyOf(latestByGuild);
    }

    @Transactional(readOnly = true)
    public PlatformGuildCompanyShareRuleResponse requiredRule(long id) {
        List<PlatformGuildCompanyShareRuleResponse> values = jdbc.query(select() + " where id=?", (rs, row) -> map(rs), id);
        if (values.isEmpty()) throw new IllegalArgumentException("company-share rule not found");
        return values.getFirst();
    }

    private String select() { return "select id,platform_code,guild_id,share_version,share_rate,effective_from,effective_to,rule_status,configured_by,approved_by,approved_at,approval_note from platform_guild_company_share_version"; }
    private PlatformGuildCompanyShareRuleResponse map(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new PlatformGuildCompanyShareRuleResponse(rs.getLong(1), rs.getString(2), rs.getString(3), rs.getInt(4), rs.getBigDecimal(5),
                rs.getTimestamp(6).toLocalDateTime(), rs.getTimestamp(7) == null ? null : rs.getTimestamp(7).toLocalDateTime(), rs.getString(8),
                nullableLong(rs, 9), nullableLong(rs, 10), rs.getTimestamp(11) == null ? null : rs.getTimestamp(11).toLocalDateTime(), rs.getString(12));
    }
    private Long nullableLong(java.sql.ResultSet rs, int index) throws java.sql.SQLException { long value = rs.getLong(index); return rs.wasNull() ? null : value; }
    private void validateRate(BigDecimal rate) { if (rate == null || rate.compareTo(BigDecimal.ZERO) < 0 || rate.compareTo(BigDecimal.ONE) > 0) throw new IllegalArgumentException("company share rate must be between 0 and 1"); }
    private String platform(String value) { String result = required(value, "platformCode").toUpperCase(Locale.ROOT); if (!"TIMO".equals(result) && !"LINKY".equals(result)) throw new IllegalArgumentException("unsupported platform"); return result; }
    private String required(String value, String field) { if (value == null || value.isBlank()) throw new IllegalArgumentException(field + " is required"); return value.trim(); }
}
