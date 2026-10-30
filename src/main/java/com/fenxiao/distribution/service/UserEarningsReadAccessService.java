package com.fenxiao.distribution.service;

import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.common.api.ForbiddenException;
import com.fenxiao.distribution.entity.UserEarningsReadAccess;
import com.fenxiao.distribution.repository.UserEarningsReadAccessRepository;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class UserEarningsReadAccessService {
    private final UserEarningsReadAccessRepository entries;
    private final UserDistributionProfileRepository users;
    private final OperationAuditLogRepository audit;
    private final JdbcTemplate jdbc;
    private final Clock clock;
    public UserEarningsReadAccessService(UserEarningsReadAccessRepository entries, UserDistributionProfileRepository users,
                                        OperationAuditLogRepository audit, JdbcTemplate jdbc, Clock clock) {
        this.entries = entries; this.users = users; this.audit = audit; this.jdbc = jdbc; this.clock = clock;
    }
    public Set<String> grantedPlatforms(long userId) {
        return entries.findByUserId(userId).stream().filter(UserEarningsReadAccess::isEnabled)
                .map(UserEarningsReadAccess::getPlatformCode).collect(Collectors.toSet());
    }
    public List<State> get(long userId, AdminSessionService.AdminPrincipal actor) {
        authorize(userId, actor);
        return states(userId);
    }
    private List<State> states(long userId) {
        var saved = entries.findByUserId(userId);
        return List.of("TIMO", "LINKY").stream().map(platform -> saved.stream()
                .filter(entry -> entry.getPlatformCode().equals(platform)).findFirst()
                .map(entry -> new State(platform, entry.isEnabled(), entry.getVersion()))
                .orElse(new State(platform, false, 0))).toList();
    }
    @Transactional
    public List<State> change(long userId, String code, boolean enabled, long expectedVersion, String reason,
                              AdminSessionService.AdminPrincipal actor, String ip) {
        authorize(userId, actor);
        String platform = ConsumerWorkspaceService.requirePlatform(code);
        if (reason == null || reason.isBlank() || reason.trim().length() > 255 || expectedVersion < 0)
            throw new IllegalArgumentException("请填写不超过255字的操作原因");
        // Serialize first grants and revocations using an existing stable user row, not a missing grant row.
        jdbc.queryForObject("SELECT user_id FROM user_distribution_profile WHERE user_id=? FOR UPDATE", Long.class, userId);
        var row = entries.findByUserId(userId).stream().filter(entry -> entry.getPlatformCode().equals(platform)).findFirst()
                .orElseGet(() -> UserEarningsReadAccess.create(userId, platform));
        if (row.getVersion() != expectedVersion)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "收益查看权限已变化，请重新读取后操作");
        if (row.getVersion() > 0 && row.isEnabled() == enabled) return states(userId);
        String before = platform + ":enabled=" + row.isEnabled() + ",version=" + row.getVersion();
        row.change(enabled, actor.accountId(), LocalDateTime.now(clock));
        entries.saveAndFlush(row);
        audit.save(OperationAuditLog.create(actor.accountId(), actor.role(), "USER_EARNINGS_READ_ACCESS", "USER", userId,
                enabled ? "GRANT" : "REVOKE", before, platform + ":enabled=" + enabled + ",version=" + row.getVersion(),
                ip, reason.trim(), LocalDateTime.now(clock)));
        return states(userId);
    }
    private void authorize(long userId, AdminSessionService.AdminPrincipal actor) {
        // This is a global per-user entitlement, not authority to manage a particular guild's binding.
        if (!"super_admin".equalsIgnoreCase(actor.role()) || !all(actor.platformScope()) || !all(actor.guildScope()) || !all(actor.regionScope()))
            throw new ForbiddenException("仅全局最高管理员可管理收益查看权限");
        if (!users.existsById(userId)) throw new IllegalArgumentException("user not found");
    }
    private boolean all(String scope) { return scope == null || scope.isBlank() || "*".equals(scope.trim()); }
    public record State(String platformCode, boolean enabled, long version) {}
}
