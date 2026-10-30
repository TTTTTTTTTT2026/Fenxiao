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
    private final UserEarningsReadAccessService grants;

    public ConsumerWorkspaceService(JdbcTemplate jdbc, UserDistributionProfileRepository users, UserEarningsReadAccessService grants) {
        this.jdbc = jdbc;
        this.users = users;
        this.grants = grants;
    }

    @Transactional(readOnly = true)
    public Workspace get(long userId) {
        if (!users.existsById(userId)) throw new IllegalArgumentException("user not found");
        var granted = grants.grantedPlatforms(userId);
        List<App> apps = List.of(status(userId, "TIMO", granted.contains("TIMO")), status(userId, "LINKY", granted.contains("LINKY")));
        String preferred = jdbc.query("SELECT platform_code FROM consumer_workspace_preference WHERE user_id=?",
                (rs, row) -> rs.getString(1), userId).stream().findFirst().orElse(null);
        boolean hasVerifiedApp = apps.stream().anyMatch(App::verified);
        String selected = apps.stream().anyMatch(app -> app.code().equals(preferred) && (hasVerifiedApp || app.earningsReadable()))
                ? preferred : apps.stream().filter(App::earningsReadable)
                .sorted((a, b) -> {
                    if (a.verified() != b.verified()) return a.verified() ? -1 : 1;
                    if (!a.verified()) return Integer.compare(a.code().equals("TIMO") ? 0 : 1, b.code().equals("TIMO") ? 0 : 1);
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
        Workspace current = get(userId);
        if (current.apps().stream().noneMatch(App::verified)
                && current.apps().stream().noneMatch(app -> app.code().equals(platform) && app.earningsReadable()))
            throw new IllegalArgumentException("no verified binding or earnings read access for this platform");
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
        if (!status(userId, platform, false).verified()) throw new IllegalArgumentException("platform binding is not verified");
        return platform;
    }

    /** Only read endpoints opt into this capability. Binding and grade checks remain requireVerified. */
    @Transactional(readOnly = true)
    public String requireEarningsRead(long userId, String code) {
        String platform = requirePlatform(code);
        if (!users.existsById(userId)) throw new IllegalArgumentException("user not found");
        if (!status(userId, platform, false).verified() && !grants.grantedPlatforms(userId).contains(platform))
            throw new IllegalArgumentException("platform binding is not verified and earnings read access is not granted");
        return platform;
    }

    private App status(long userId, String code, boolean granted) {
        if (code.equals("TIMO")) {
            return jdbc.query("SELECT binding_status,verified_at FROM platform_account_binding WHERE user_id=? AND platform_code='TIMO'",
                    (rs, row) -> new App("TIMO", "VERIFIED".equals(rs.getString(1)), rs.getTimestamp(2) == null ? null : rs.getTimestamp(2).toLocalDateTime(), granted),
                    userId).stream().findFirst().orElse(new App("TIMO", false, null, granted));
        }
        return jdbc.query("SELECT checked_at FROM linky_account_binding WHERE user_id=? AND registration_eligibility='ELIGIBLE' AND guild_check_status='MATCHED_OURS' ORDER BY id DESC LIMIT 1",
                (rs, row) -> new App("LINKY", true, rs.getTimestamp(1) == null ? null : rs.getTimestamp(1).toLocalDateTime(), granted),
                userId).stream().findFirst().orElse(new App("LINKY", false, null, granted));
    }

    public record App(String code, boolean verified, LocalDateTime verifiedAt, boolean earningsAccessGranted) {
        @com.fasterxml.jackson.annotation.JsonProperty("earningsReadable")
        public boolean earningsReadable() { return verified || earningsAccessGranted; }
    }
    public record Workspace(String selected, String preferred, List<App> apps) { }
}
