package com.fenxiao.distribution.service;

import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class ConsumerWorkspaceService {
    private final JdbcTemplate jdbc;
    private final UserDistributionProfileRepository users;

    public ConsumerWorkspaceService(JdbcTemplate jdbc, UserDistributionProfileRepository users) {
        this.jdbc = jdbc;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public Workspace get(long userId) {
        if (!users.existsById(userId)) throw new IllegalArgumentException("user not found");
        List<App> apps = List.of(status(userId, "TIMO"), status(userId, "LINKY"));
        String preferred = jdbc.query("SELECT platform_code FROM consumer_workspace_preference WHERE user_id=?",
                (rs, row) -> rs.getString(1), userId).stream().findFirst().orElse(null);
        String selected = apps.stream().anyMatch(app -> app.code().equals(preferred) && app.verified())
                ? preferred : apps.stream().filter(App::verified)
                .sorted((a, b) -> {
                    if (a.verifiedAt() == null) return b.verifiedAt() == null ? a.code().compareTo(b.code()) : 1;
                    if (b.verifiedAt() == null) return -1;
                    int order = a.verifiedAt().compareTo(b.verifiedAt());
                    return order == 0 ? a.code().compareTo(b.code()) : order;
                }).map(App::code).findFirst().orElse(null);
        return new Workspace(selected, preferred, apps);
    }

    @Transactional
    public Workspace select(long userId, String code) {
        String platform = requirePlatform(code);
        if (!status(userId, platform).verified()) throw new IllegalArgumentException("platform binding is not verified");
        jdbc.update("""
                INSERT INTO consumer_workspace_preference(user_id,platform_code,updated_at)
                VALUES (?,?,CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE platform_code=VALUES(platform_code),updated_at=CURRENT_TIMESTAMP
                """,
                userId, platform);
        return get(userId);
    }

    public static String requirePlatform(String code) {
        String normalized = code == null ? "" : code.trim().toUpperCase(Locale.ROOT);
        if (!normalized.equals("TIMO") && !normalized.equals("LINKY"))
            throw new IllegalArgumentException("unsupported workspace platform");
        return normalized;
    }

    @Transactional(readOnly = true)
    public String requireVerified(long userId, String code) {
        if (!users.existsById(userId)) throw new IllegalArgumentException("user not found");
        String platform = requirePlatform(code);
        if (!status(userId, platform).verified()) throw new IllegalArgumentException("platform binding is not verified");
        return platform;
    }

    private App status(long userId, String code) {
        if (code.equals("TIMO")) {
            return jdbc.query("SELECT binding_status,verified_at FROM platform_account_binding WHERE user_id=? AND platform_code='TIMO'",
                    (rs, row) -> new App("TIMO", "VERIFIED".equals(rs.getString(1)), rs.getTimestamp(2) == null ? null : rs.getTimestamp(2).toLocalDateTime()),
                    userId).stream().findFirst().orElse(new App("TIMO", false, null));
        }
        return jdbc.query("SELECT checked_at FROM linky_account_binding WHERE user_id=? AND registration_eligibility='ELIGIBLE' AND guild_check_status='MATCHED_OURS' ORDER BY id DESC LIMIT 1",
                (rs, row) -> new App("LINKY", true, rs.getTimestamp(1) == null ? null : rs.getTimestamp(1).toLocalDateTime()),
                userId).stream().findFirst().orElse(new App("LINKY", false, null));
    }

    public record App(String code, boolean verified, LocalDateTime verifiedAt) { }
    public record Workspace(String selected, String preferred, List<App> apps) { }
}
