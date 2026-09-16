package com.fenxiao.incentive.service;

import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.incentive.dto.OperatingDividendDashboardResponse;
import com.fenxiao.incentive.dto.OperatingDividendPolicyRequest;
import com.fenxiao.incentive.dto.OperatingDividendPolicyResponse;
import com.fenxiao.incentive.dto.OperatingDividendProfitFactResponse;
import com.fenxiao.incentive.dto.OperatingDividendShadowEntryResponse;
import com.fenxiao.platform.entity.PlatformGuildDirectory;
import com.fenxiao.platform.repository.PlatformGuildDirectoryRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

/**
 * Operations console for team operating-dividend policies.
 * This service only governs shadow calculation; it never creates rewards, balances or payments.
 */
@Service
@Transactional
public class OperatingDividendAdminService {
    private static final String MODULE = "operating_dividend";
    private final JdbcTemplate jdbc;
    private final OperationAuditLogRepository audits;
    private final PlatformGuildDirectoryRepository guildDirectory;
    private final Clock clock;

    public OperatingDividendAdminService(JdbcTemplate jdbc, OperationAuditLogRepository audits,
                                         PlatformGuildDirectoryRepository guildDirectory, Clock clock) {
        this.jdbc = jdbc;
        this.audits = audits;
        this.guildDirectory = guildDirectory;
        this.clock = clock;
    }

    public OperatingDividendDashboardResponse dashboard() {
        return new OperatingDividendDashboardResponse(
                count("select count(*) from leadership_policy_version where rule_status='ACTIVE'"),
                count("select count(*) from leadership_qualification where qualification_code='TEAM_PROFIT_SHARE' and qualification_status='QUALIFIED'"),
                count("select count(*) from team_profit_fact"),
                count("select count(*) from team_profit_share_shadow_ledger"),
                policies(), recentProfitFacts(), recentShadowEntries());
    }

    public List<OperatingDividendPolicyResponse> policies() {
        return jdbc.query("select id,policy_code,policy_version,platform_code,country_code,guild_id,required_valid_starts,required_withdraw_eligible,required_active_7d,profit_share_rate,effective_from,effective_to,rule_status,created_by,approved_by,approved_at,approval_note " +
                        "from leadership_policy_version order by effective_from desc,id desc",
                (rs, row) -> mapPolicy(rs));
    }

    public OperatingDividendPolicyResponse createDraft(OperatingDividendPolicyRequest request, AdminSessionService.AdminPrincipal actor) {
        validate(request);
        LocalDateTime effectiveFrom = request.effectiveFrom() == null ? LocalDateTime.now(clock) : request.effectiveFrom();
        String code = "OD-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT);
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("insert into leadership_policy_version(policy_code,policy_version,platform_code,country_code,guild_id,required_valid_starts,required_withdraw_eligible,required_active_7d,profit_share_rate,effective_from,effective_to,enabled,rule_status,created_by) values(?,1,?,?,?,?,?,?,?,?,?,false,'DRAFT',?)", new String[]{"id"});
            statement.setString(1, code);
            statement.setString(2, platform(request.platformCode()));
            statement.setString(3, upper(request.countryCode()));
            statement.setString(4, trimToNull(request.guildId()));
            statement.setInt(5, request.requiredValidStarts());
            statement.setInt(6, request.requiredWithdrawEligible());
            statement.setInt(7, request.requiredActive7d());
            statement.setBigDecimal(8, request.profitShareRate());
            statement.setObject(9, effectiveFrom);
            statement.setObject(10, request.effectiveTo());
            statement.setLong(11, actor.accountId());
            return statement;
        }, keys);
        OperatingDividendPolicyResponse created = policy(Objects.requireNonNull(keys.getKey()).longValue());
        audit(actor, created.id(), "CREATE_DRAFT", null, snapshot(created), "建立运营分红影子规则草稿；不会产生奖励或付款");
        return created;
    }

    public OperatingDividendPolicyResponse activate(long id, String note, AdminSessionService.AdminPrincipal actor) {
        OperatingDividendPolicyResponse current = policy(id);
        if (!"DRAFT".equals(current.status())) throw new IllegalStateException("only draft operating dividend policy can be activated");
        ensureNoOverlap(current);
        jdbc.update("update leadership_policy_version set enabled=true,rule_status='ACTIVE',approved_by=?,approved_at=?,approval_note=? where id=?",
                actor.accountId(), LocalDateTime.now(clock), note.trim(), id);
        OperatingDividendPolicyResponse updated = policy(id);
        audit(actor, id, "ACTIVATE", snapshot(current), snapshot(updated), "审批启用运营分红影子规则；不会产生奖励或付款");
        return updated;
    }

    public OperatingDividendPolicyResponse retire(long id, AdminSessionService.AdminPrincipal actor) {
        OperatingDividendPolicyResponse current = policy(id);
        if (!"ACTIVE".equals(current.status())) throw new IllegalStateException("only active operating dividend policy can be retired");
        jdbc.update("update leadership_policy_version set enabled=false,rule_status='RETIRED',effective_to=coalesce(effective_to,?) where id=?", LocalDateTime.now(clock), id);
        OperatingDividendPolicyResponse updated = policy(id);
        audit(actor, id, "RETIRE", snapshot(current), snapshot(updated), "停止运营分红影子规则；不会改写历史影子账本");
        return updated;
    }

    private List<OperatingDividendProfitFactResponse> recentProfitFacts() {
        return jdbc.query("select id,team_id,platform_code,period_start,period_end,operating_profit_minor,currency_code,source_system,source_event_id,received_at from team_profit_fact order by received_at desc,id desc limit 20",
                (rs, row) -> new OperatingDividendProfitFactResponse(rs.getLong(1), rs.getLong(2), rs.getString(3), rs.getDate(4).toLocalDate(), rs.getDate(5).toLocalDate(), rs.getLong(6), rs.getString(7), rs.getString(8), rs.getString(9), rs.getTimestamp(10).toLocalDateTime()));
    }

    private List<OperatingDividendShadowEntryResponse> recentShadowEntries() {
        return jdbc.query("select id,team_id,leader_user_id,platform_code,policy_id,share_rate,share_amount_minor,currency_code,ledger_status,triggered_at from team_profit_share_shadow_ledger order by triggered_at desc,id desc limit 20",
                (rs, row) -> new OperatingDividendShadowEntryResponse(rs.getLong(1), rs.getLong(2), rs.getLong(3), rs.getString(4), rs.getLong(5), rs.getBigDecimal(6), rs.getLong(7), rs.getString(8), rs.getString(9), rs.getTimestamp(10).toLocalDateTime()));
    }

    private OperatingDividendPolicyResponse policy(long id) {
        List<OperatingDividendPolicyResponse> values = jdbc.query("select id,policy_code,policy_version,platform_code,country_code,guild_id,required_valid_starts,required_withdraw_eligible,required_active_7d,profit_share_rate,effective_from,effective_to,rule_status,created_by,approved_by,approved_at,approval_note from leadership_policy_version where id=?", (rs, row) -> mapPolicy(rs), id);
        if (values.isEmpty()) throw new IllegalArgumentException("operating dividend policy not found");
        return values.get(0);
    }

    private OperatingDividendPolicyResponse mapPolicy(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new OperatingDividendPolicyResponse(rs.getLong(1), rs.getString(2), rs.getInt(3), rs.getString(4), rs.getString(5), rs.getString(6), rs.getInt(7), rs.getInt(8), rs.getInt(9), rs.getBigDecimal(10), rs.getTimestamp(11).toLocalDateTime(), rs.getTimestamp(12) == null ? null : rs.getTimestamp(12).toLocalDateTime(), rs.getString(13), nullableLong(rs, 14), nullableLong(rs, 15), rs.getTimestamp(16) == null ? null : rs.getTimestamp(16).toLocalDateTime(), rs.getString(17));
    }

    private void ensureNoOverlap(OperatingDividendPolicyResponse candidate) {
        for (OperatingDividendPolicyResponse other : policies()) {
            if (other.id() == candidate.id() || !"ACTIVE".equals(other.status())) continue;
            if (!other.platformCode().equals(candidate.platformCode()) || !other.countryCode().equals(candidate.countryCode()) || !Objects.equals(other.guildId(), candidate.guildId())) continue;
            boolean candidateStartsBeforeOtherEnds = other.effectiveTo() == null || !candidate.effectiveFrom().isAfter(other.effectiveTo());
            boolean otherStartsBeforeCandidateEnds = candidate.effectiveTo() == null || !other.effectiveFrom().isAfter(candidate.effectiveTo());
            if (candidateStartsBeforeOtherEnds && otherStartsBeforeCandidateEnds) throw new IllegalStateException("an active operating dividend policy already overlaps this scope");
        }
    }

    private void validate(OperatingDividendPolicyRequest request) {
        if (request.effectiveTo() != null && request.effectiveFrom() != null && request.effectiveTo().isBefore(request.effectiveFrom())) throw new IllegalArgumentException("effectiveTo must not be before effectiveFrom");
        String platform = platform(request.platformCode());
        String country = upper(request.countryCode());
        if (request.guildId() != null && !request.guildId().isBlank()) validateAuthoritativeGuild(platform, country, request.guildId().trim());
    }

    private void validateAuthoritativeGuild(String platform, String country, String guildId) {
        List<PlatformGuildDirectory> found = guildDirectory.findByPlatformCodeAndExternalGuildIdIn(platform, List.of(guildId));
        if (found.size() != 1 || !country.equals(directoryCountryCode(found.get(0).getCountry())) || !"NORMAL".equalsIgnoreCase(found.get(0).getDirectoryStatus()) || !("ACTIVE".equalsIgnoreCase(found.get(0).getGuildStatus()) || "ENABLED".equalsIgnoreCase(found.get(0).getGuildStatus()))) {
            throw new IllegalArgumentException("operating dividend guild scope must use an active authoritative platform guild for the selected country");
        }
    }

    private long count(String sql) {
        Long value = jdbc.queryForObject(sql, Long.class);
        return value == null ? 0 : value;
    }

    private Long nullableLong(java.sql.ResultSet rs, int index) throws java.sql.SQLException {
        long value = rs.getLong(index);
        return rs.wasNull() ? null : value;
    }

    private void audit(AdminSessionService.AdminPrincipal actor, long id, String action, String before, String after, String remark) {
        audits.save(OperationAuditLog.create(actor.accountId(), actor.role(), MODULE, "operating_dividend_policy", id, action, before, after, null, remark, LocalDateTime.now(clock)));
    }

    private String snapshot(OperatingDividendPolicyResponse policy) {
        return "code=" + policy.policyCode() + ";scope=" + policy.platformCode() + "/" + policy.countryCode() + "/" + (policy.guildId() == null ? "ALL_GUILDS" : policy.guildId()) + ";status=" + policy.status() + ";rate=" + policy.profitShareRate();
    }

    private String platform(String value) {
        String normalized = upper(value);
        if (!"LINKY".equals(normalized) && !"TIMO".equals(normalized)) throw new IllegalArgumentException("unsupported platform");
        return normalized;
    }

    private String upper(String value) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException("value is required");
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String directoryCountryCode(String value) {
        return switch (upper(value)) {
            case "BRAZIL" -> "BR";
            case "INDONESIA" -> "ID";
            case "MEXICO" -> "MX";
            default -> upper(value);
        };
    }
}
