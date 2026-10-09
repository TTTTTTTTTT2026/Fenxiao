package com.fenxiao.admin.service;

import com.fenxiao.admin.entity.AdminAccount;
import com.fenxiao.admin.repository.AdminAccountRepository;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class UserOperationsAdminService {
    public static final String GENERAL = "GENERAL";
    public static final String HIGH_VALUE = "HIGH_VALUE";

    private final JdbcTemplate jdbc;
    private final UserDistributionProfileRepository users;
    private final AdminAccountRepository accounts;
    private final OperationAuditLogRepository auditLogs;
    private final Clock clock;

    @Autowired
    public UserOperationsAdminService(JdbcTemplate jdbc, UserDistributionProfileRepository users,
                                      AdminAccountRepository accounts, OperationAuditLogRepository auditLogs) {
        this(jdbc, users, accounts, auditLogs, Clock.systemUTC());
    }

    UserOperationsAdminService(JdbcTemplate jdbc, UserDistributionProfileRepository users,
                               AdminAccountRepository accounts, OperationAuditLogRepository auditLogs, Clock clock) {
        this.jdbc = jdbc;
        this.users = users;
        this.accounts = accounts;
        this.auditLogs = auditLogs;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public Options options() {
        List<OperatorOption> operators = accounts.findAll().stream()
                .sorted((left, right) -> left.getDisplayName().compareToIgnoreCase(right.getDisplayName()))
                .map(account -> new OperatorOption(account.getId(), account.getDisplayName(), account.getUsername(), account.isEnabled()))
                .toList();
        List<String> countries = jdbc.queryForList(
                "select distinct country_code from user_distribution_profile order by country_code", String.class);
        List<GuildOption> linkyGuilds = jdbc.query("""
                select l.guild_id, max(l.guild_name) as guild_name from linky_account_binding l
                where l.user_id is not null and l.guild_id is not null and l.guild_id <> ''
                  and l.id = (select max(latest.id) from linky_account_binding latest where latest.user_id = l.user_id)
                group by l.guild_id order by l.guild_id
                """, (rs, row) -> new GuildOption(rs.getString(1), rs.getString(2)));
        List<GuildOption> timoGuilds = jdbc.query("""
                select distinct official_guild_id from platform_account_binding
                where platform_code = 'TIMO' and official_guild_id is not null and official_guild_id <> ''
                order by official_guild_id
                """, (rs, row) -> new GuildOption(rs.getString(1), null));
        return new Options(operators, countries, linkyGuilds, timoGuilds);
    }

    @Transactional
    public Current changeOperator(Long userId, Long operatorAdminId, String reason,
                                  AdminSessionService.AdminPrincipal actor, String requestIp) {
        String normalizedReason = requireReason(reason);
        if (operatorAdminId != null) {
            accounts.findById(operatorAdminId).filter(AdminAccount::isEnabled)
                    .orElseThrow(() -> new IllegalArgumentException("operator admin account not found or disabled"));
        }
        lockUser(userId);
        Current before = current(userId);
        if (Objects.equals(before.operatorAdminId(), operatorAdminId)) return before;
        LocalDateTime now = LocalDateTime.now(clock);
        persistCurrent(userId, operatorAdminId, before.valueCode(), now);
        jdbc.update("""
                insert into user_operations_profile_change
                (user_id, field_name, old_operator_admin_id, new_operator_admin_id, changed_by_admin_id, reason, changed_at)
                values (?, 'OPERATOR', ?, ?, ?, ?, ?)
                """, userId, before.operatorAdminId(), operatorAdminId, actor.accountId(), normalizedReason, now);
        auditLogs.save(OperationAuditLog.create(actor.accountId(), actor.role(), "user", "user_operations_profile",
                userId, "CHANGE_OPERATOR", "operatorAdminId=" + before.operatorAdminId(),
                "operatorAdminId=" + operatorAdminId, requestIp, normalizedReason, now));
        return current(userId);
    }

    @Transactional
    public Current changeValue(Long userId, String valueCode, String reason,
                               AdminSessionService.AdminPrincipal actor, String requestIp) {
        String normalizedReason = requireReason(reason);
        if (!GENERAL.equals(valueCode) && !HIGH_VALUE.equals(valueCode))
            throw new IllegalArgumentException("invalid user value");
        lockUser(userId);
        Current before = current(userId);
        if (before.valueCode().equals(valueCode)) return before;
        LocalDateTime now = LocalDateTime.now(clock);
        persistCurrent(userId, before.operatorAdminId(), valueCode, now);
        jdbc.update("""
                insert into user_operations_profile_change
                (user_id, field_name, old_value_code, new_value_code, changed_by_admin_id, reason, changed_at)
                values (?, 'VALUE', ?, ?, ?, ?, ?)
                """, userId, before.valueCode(), valueCode, actor.accountId(), normalizedReason, now);
        auditLogs.save(OperationAuditLog.create(actor.accountId(), actor.role(), "user", "user_operations_profile",
                userId, "CHANGE_USER_VALUE", "valueCode=" + before.valueCode(),
                "valueCode=" + valueCode, requestIp, normalizedReason, now));
        return current(userId);
    }

    @Transactional(readOnly = true)
    public Current current(Long userId) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                select p.operator_admin_id, coalesce(p.value_code, 'GENERAL') as value_code, a.display_name
                from user_distribution_profile u
                left join user_operations_profile p on p.user_id = u.user_id
                left join admin_account a on a.id = p.operator_admin_id
                where u.user_id = ?
                """, userId);
        if (rows.isEmpty()) throw new IllegalArgumentException("user not found");
        Map<String, Object> row = rows.get(0);
        Number operatorId = (Number) row.get("operator_admin_id");
        return new Current(operatorId == null ? null : operatorId.longValue(),
                (String) row.get("display_name"), (String) row.get("value_code"));
    }

    private void lockUser(Long userId) {
        if (userId == null || userId <= 0 || !users.existsById(userId))
            throw new IllegalArgumentException("user not found");
        // Serialize both field updates against the stable user row, including the first assignment.
        jdbc.queryForObject("select user_id from user_distribution_profile where user_id = ? for update", Long.class, userId);
    }

    private void persistCurrent(Long userId, Long operatorId, String valueCode, LocalDateTime now) {
        int changed = jdbc.update("""
                update user_operations_profile set operator_admin_id = ?, value_code = ?, updated_at = ? where user_id = ?
                """, operatorId, valueCode, now, userId);
        if (changed == 0) jdbc.update("""
                insert into user_operations_profile (user_id, operator_admin_id, value_code, updated_at) values (?, ?, ?, ?)
                """, userId, operatorId, valueCode, now);
    }

    private String requireReason(String reason) {
        if (reason == null || reason.isBlank() || reason.trim().length() > 255)
            throw new IllegalArgumentException("change reason is required (1-255 characters)");
        return reason.trim();
    }

    public record Current(Long operatorAdminId, String operatorName, String valueCode) {}
    public record OperatorOption(Long id, String displayName, String username, boolean enabled) {}
    public record GuildOption(String guildId, String guildName) {}
    public record Options(List<OperatorOption> operators, List<String> countries,
                          List<GuildOption> linkyGuilds, List<GuildOption> timoGuilds) {}
}
