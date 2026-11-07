package com.fenxiao.admin.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.common.api.ForbiddenException;
import com.fenxiao.distribution.service.ConsumerWorkspaceService;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;

@Service
public class UserBindingResetService {
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;
    private final OperationAuditLogRepository audits;
    private final Clock clock;

    public UserBindingResetService(JdbcTemplate jdbc, ObjectMapper json, OperationAuditLogRepository audits, Clock clock) {
        this.jdbc = jdbc;
        this.json = json;
        this.audits = audits;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public Preview preview(long userId, String code, AdminSessionService.AdminPrincipal actor) {
        String platform = ConsumerWorkspaceService.requirePlatform(code);
        return inspect(userId, platform, actor, false).preview();
    }

    @Transactional
    public void reset(long userId, String code, String revision, String reason,
                      AdminSessionService.AdminPrincipal actor, String ip) {
        String platform = ConsumerWorkspaceService.requirePlatform(code);
        Inspection current = inspect(userId, platform, actor, true);
        Preview preview = current.preview();
        if (preview.revision() == null || !preview.revision().equals(revision)) {
            throw conflict("绑定记录已变化，请重新读取后确认。");
        }
        if (preview.blockedReason() != null) throw conflict(preview.blockedReason());

        long bindingId = number(current.binding(), "id");
        LocalDateTime now = LocalDateTime.now(clock);
        jdbc.update("""
                INSERT INTO platform_binding_reset_archive
                    (user_id, platform_code, binding_id, platform_user_id, previously_verified, snapshot_data, reset_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, userId, platform, bindingId, current.account(), current.verified(), current.snapshot(), now);

        if ("TIMO".equals(platform)) {
            jdbc.update("""
                    INSERT INTO platform_binding_history
                        (binding_id, user_id, platform_code, platform_user_id, from_status, to_status,
                         reason_code, source_system, operator_id, occurred_at, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, 'UNBOUND', 'ADMIN_RESET', 'BANDEIRA', ?, ?, ?, ?)
                    """, bindingId, userId, platform, current.account(), preview.status(), actor.accountId(), now, now, now);
            jdbc.update("DELETE FROM platform_lifecycle_snapshot WHERE user_id=? AND platform_code='TIMO'", userId);
            jdbc.update("DELETE FROM platform_account_binding WHERE id=?", bindingId);
        } else {
            resetLinky(userId, bindingId, current.registration(), now);
        }

        audits.save(OperationAuditLog.create(actor.accountId(), actor.role(), "USER_PLATFORM_BINDING", "USER", userId,
                "RESET", platform + ":" + preview.status() + ":" + preview.maskedAccount(),
                platform + ":UNBOUND", ip, reason.trim(), now));
    }

    private Inspection inspect(long userId, String platform, AdminSessionService.AdminPrincipal actor, boolean locking) {
        String lock = locking ? " FOR UPDATE" : "";
        var countries = jdbc.query("SELECT country_code FROM user_distribution_profile WHERE user_id=?" + lock,
                (row, index) -> row.getString(1), userId);
        if (countries.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "用户不存在。");
        String country = countries.getFirst();
        requireKnownScope(actor.regionScope(), country);
        actor.requireScope(platform, null, country);

        boolean timo = "TIMO".equals(platform);
        var bindings = jdbc.queryForList(timo
                ? "SELECT * FROM platform_account_binding WHERE user_id=? AND platform_code='TIMO'" + lock
                : "SELECT * FROM linky_account_binding WHERE user_id=?" + lock, userId);
        if (bindings.isEmpty()) return unavailable("UNBOUND", "用户可直接提交该应用的 ID。");
        if (bindings.size() != 1) return unavailable("UNKNOWN", "存在多条绑定，需人工复核。");
        Map<String, Object> binding = bindings.getFirst();
        String guild = value(binding, timo ? "official_guild_id" : "guild_id");
        requireKnownScope(actor.guildScope(), guild);
        actor.requireScope(platform, guild, country);

        String account = value(binding, timo ? "platform_user_id" : "linky_account");
        String status = value(binding, timo ? "binding_status" : "guild_check_status");
        boolean verified = !timo || "VERIFIED".equals(status) || value(binding, "verified_at") != null || has(
                "SELECT 1 FROM platform_binding_history WHERE binding_id=? AND to_status='VERIFIED'", number(binding, "id"));
        if (timo && !List.of("SUBMITTED", "VERIFYING", "REJECTED", "VERIFIED").contains(status)) {
            return unavailable(status, "该状态需要人工复核。");
        }
        List<Map<String, Object>> registrations = timo ? List.of() : jdbc.queryForList(
                "SELECT * FROM invite_binding_registration WHERE linky_account=?" + lock, account);
        Map<String, Object> registration = registrations.isEmpty() ? Map.of() : registrations.getFirst();
        List<Map<String, Object>> lifecycle = timo ? jdbc.queryForList(
                "SELECT * FROM platform_lifecycle_snapshot WHERE user_id=? AND platform_code='TIMO'" + lock, userId) : List.of();
        List<Map<String, Object>> attribution = timo ? List.of() : jdbc.queryForList("""
                SELECT * FROM linky_invitation_guild_attribution WHERE user_id=? AND attribution_source='VERIFIED_BINDING'
                """ + lock, userId);
        List<Map<String, Object>> ownership = registration.isEmpty() ? List.of() : jdbc.queryForList("""
                SELECT * FROM user_product_ownership WHERE user_id=? AND product_code='LINKY'
                AND ownership_source='INVITE_BINDING' AND source_record_type='INVITE_BINDING_REGISTRATION'
                AND source_record_id=? AND ownership_status='ACTIVE'
                """ + lock, userId, number(registration, "id"));

        String blocked = null;
        if (!registration.isEmpty() && (!"LINKY".equals(value(registration, "product_code"))
                || value(binding, "phone_number") == null
                || !value(binding, "phone_number").equals(value(registration, "whatsapp_number"))
                || has("""
                       SELECT 1 FROM user_product_ownership
                       WHERE source_record_type='INVITE_BINDING_REGISTRATION' AND source_record_id=?
                       AND ownership_status='ACTIVE' AND (user_id<>? OR product_code<>'LINKY')
                       """, number(registration, "id"), userId))) {
            blocked = "Linky 登记归属需人工复核。";
        } else if (verified && !AdminPermission.ACCOUNT_MANAGE.allows(actor.role())) {
            blocked = "曾通过核验的绑定需最高管理员复核。";
        } else if (hasDependentRecords(userId, platform, account)
                || !attribution.isEmpty() && has(
                "SELECT 1 FROM linky_invitation_guild_attribution WHERE inherited_from_user_id=?", userId)) {
            blocked = "此绑定已关联收益、资格、活动或下游公会归属，请人工复核。";
        }
        String snapshot = serialize(new Snapshot(binding, registration, lifecycle, attribution, ownership));
        String revision = digest(snapshot);
        String masked = "••••" + account.substring(Math.max(0, account.length() - 4));
        return new Inspection(new Preview(status, masked, revision, blocked), binding, registration, account, verified, snapshot);
    }

    private boolean hasDependentRecords(long userId, String platform, String account) {
        return has("SELECT 1 FROM platform_business_fact WHERE platform_code=? AND (user_id=? OR platform_user_id=?)",
                platform, userId, account)
                || has("SELECT 1 FROM mcn_income_raw_ledger_event WHERE platform_code=? AND platform_user_id=?", platform, account)
                || has("SELECT 1 FROM mcn_income_shadow_ledger_projection WHERE platform_code=? AND resolved_user_id=?", platform, userId)
                || has("SELECT 1 FROM mcn_income_reward_candidate_projection WHERE platform_code=? AND source_user_id=?", platform, userId)
                || has("SELECT 1 FROM incentive_shadow_ledger WHERE platform_code=? AND (source_user_id=? OR platform_user_id=?)",
                platform, userId, account)
                || has("SELECT 1 FROM invitation_reward_account_ledger WHERE platform_code=? AND source_user_id=?", platform, userId)
                || has("SELECT 1 FROM user_direct_invitee_point_fact WHERE platform_code=? AND source_user_id=?", platform, userId)
                || has("SELECT 1 FROM invitation_verification_campaign_award WHERE platform_code=? AND invited_user_id=?", platform, userId)
                || has("SELECT 1 FROM effective_user_qualification_fact WHERE platform_code=? AND user_id=? AND qualification_status<>'NOT_QUALIFIED'", platform, userId)
                || has("SELECT 1 FROM user_grade_evaluation WHERE platform_code=? AND user_id=? AND qualification_status<>'IN_PROGRESS'", platform, userId)
                || has("SELECT 1 FROM user_grade_advancement_review WHERE platform_code=? AND user_id=?", platform, userId)
                || has("SELECT 1 FROM leadership_qualification WHERE platform_code=? AND user_id=? AND qualification_status='QUALIFIED'", platform, userId);
    }

    private void resetLinky(long userId, long bindingId, Map<String, Object> registration, LocalDateTime now) {
        if (!registration.isEmpty()) {
            long registrationId = number(registration, "id");
            jdbc.update("""
                    UPDATE user_product_ownership SET ownership_status='CORRECTED', effective_at=?, updated_at=?
                    WHERE user_id=? AND product_code='LINKY' AND ownership_source='INVITE_BINDING'
                    AND source_record_type='INVITE_BINDING_REGISTRATION' AND source_record_id=?
                    AND ownership_status='ACTIVE'
                    """, now, now, userId, registrationId);
            jdbc.update("DELETE FROM invite_binding_registration WHERE id=?", registrationId);
        }
        jdbc.update("DELETE FROM linky_account_binding WHERE id=?", bindingId);
        jdbc.update("""
                DELETE FROM linky_invitation_guild_attribution WHERE user_id=? AND attribution_source='VERIFIED_BINDING'
                """, userId);
    }

    private boolean has(String sql, Object... args) {
        return Boolean.TRUE.equals(jdbc.query("SELECT EXISTS (" + sql + ")", rs -> rs.next() && rs.getBoolean(1), args));
    }

    private static void requireKnownScope(String scope, String value) {
        if ((value == null || value.isBlank()) && scope != null && !scope.isBlank() && !"*".equals(scope.trim())) {
            throw new ForbiddenException("无法确认此记录在你的管理范围内。");
        }
    }

    private static String value(Map<String, Object> row, String column) {
        Object value = row.get(column);
        return value == null ? null : value.toString();
    }

    private static long number(Map<String, Object> row, String column) {
        return ((Number) row.get(column)).longValue();
    }

    private String serialize(Snapshot snapshot) {
        try {
            return json.writeValueAsString(snapshot);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Unable to archive binding", ex);
        }
    }

    private static String digest(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException(ex);
        }
    }

    private static Inspection unavailable(String status, String reason) {
        return new Inspection(new Preview(status, null, null, reason), Map.of(), Map.of(), null, false, null);
    }

    private static ResponseStatusException conflict(String reason) {
        return new ResponseStatusException(HttpStatus.CONFLICT, reason);
    }

    private record Snapshot(Map<String, Object> binding, Map<String, Object> registration,
                            List<Map<String, Object>> lifecycle, List<Map<String, Object>> invitationGuild,
                            List<Map<String, Object>> ownership) {}
    private record Inspection(Preview preview, Map<String, Object> binding, Map<String, Object> registration,
                              String account, boolean verified, String snapshot) {}
    public record Preview(String status, String maskedAccount, String revision, String blockedReason) {}
}
