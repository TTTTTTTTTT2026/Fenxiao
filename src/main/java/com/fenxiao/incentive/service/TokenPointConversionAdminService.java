package com.fenxiao.incentive.service;

import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.incentive.dto.TokenPointConversionDashboardResponse;
import com.fenxiao.incentive.dto.TokenPointConversionRequest;
import com.fenxiao.incentive.dto.TokenPointConversionResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;

/** Permanent per-platform token-to-points configuration. It is not a point accrual job. */
@Service
@Transactional
public class TokenPointConversionAdminService {
    private static final String MODULE = "token_point_conversion";
    private static final List<String> PLATFORMS = List.of("TIMO", "LINKY");
    private final JdbcTemplate jdbc;
    private final OperationAuditLogRepository audits;
    private final Clock clock;

    public TokenPointConversionAdminService(JdbcTemplate jdbc, OperationAuditLogRepository audits, Clock clock) {
        this.jdbc = jdbc; this.audits = audits; this.clock = clock;
    }

    @Transactional(readOnly = true)
    public TokenPointConversionDashboardResponse dashboard() {
        List<TokenPointConversionResponse> values = PLATFORMS.stream().map(this::currentSetting).toList();
        return new TokenPointConversionDashboardResponse(values.stream().filter(TokenPointConversionResponse::configured).count(), values);
    }

    /** Saves one long-lived setting. Existing active records are retained as audit history, never as a time range UI. */
    public TokenPointConversionResponse save(String platformCode, TokenPointConversionRequest request, AdminSessionService.AdminPrincipal actor) {
        String platform = platform(platformCode);
        if (!platform.equals(platform(request.platformCode()))) throw new IllegalArgumentException("platformCode must match request path");
        validate(request);
        LocalDateTime now = LocalDateTime.now(clock);
        TokenPointConversionResponse before = currentSetting(platform);
        Long targetId = before.id();

        if (targetId == null) {
            List<Long> drafts = jdbc.query("select id from token_point_conversion_version where platform_code=? and rule_status='DRAFT' order by id desc", (rs, row) -> rs.getLong(1), platform);
            if (!drafts.isEmpty()) targetId = drafts.getFirst();
        }

        if (targetId != null) {
            jdbc.update("update token_point_conversion_version set rule_status='RETIRED',effective_to=coalesce(effective_to,?),updated_at=? where platform_code=? and rule_status='ACTIVE' and id<>?", now, now, platform, targetId);
            jdbc.update("update token_point_conversion_version set token_unit=?,points_per_token=?,effective_to=null,rule_status='ACTIVE',approved_by=null,approved_at=null,approval_note=null,updated_at=? where id=?", tokenUnit(platform), request.pointsPerToken(), now, targetId);
        } else {
            String code = "TPC-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT);
            KeyHolder keys = new GeneratedKeyHolder();
            jdbc.update(connection -> {
                PreparedStatement statement = connection.prepareStatement("insert into token_point_conversion_version(conversion_code,conversion_version,platform_code,token_unit,points_per_token,effective_from,effective_to,rule_status,created_by) values(?,1,?,?,?,?,null,'ACTIVE',?)", new String[]{"id"});
                statement.setString(1, code); statement.setString(2, platform); statement.setString(3, tokenUnit(platform));
                statement.setBigDecimal(4, request.pointsPerToken()); statement.setObject(5, now); statement.setLong(6, actor.accountId());
                return statement;
            }, keys);
            targetId = Objects.requireNonNull(keys.getKey()).longValue();
            jdbc.update("update token_point_conversion_version set rule_status='RETIRED',effective_to=coalesce(effective_to,?),updated_at=? where platform_code=? and rule_status='ACTIVE' and id<>?", now, now, platform, targetId);
        }

        TokenPointConversionResponse updated = currentSetting(platform);
        audit(actor, Objects.requireNonNull(updated.id()), before, updated);
        return updated;
    }

    private void validate(TokenPointConversionRequest request) {
        platform(request.platformCode());
        if (request.pointsPerToken() == null || request.pointsPerToken().compareTo(BigDecimal.ZERO) < 0) throw new IllegalArgumentException("pointsPerToken must not be negative");
    }

    private TokenPointConversionResponse currentSetting(String platform) {
        List<TokenPointConversionResponse> values = jdbc.query(select() + " where platform_code=? and rule_status='ACTIVE' order by id desc limit 1", (rs, row) -> map(rs), platform);
        return values.isEmpty() ? new TokenPointConversionResponse(null, platform, tokenUnit(platform), null, false, null) : values.getFirst();
    }

    private String select() { return "select id,platform_code,token_unit,points_per_token,updated_at from token_point_conversion_version"; }
    private TokenPointConversionResponse map(java.sql.ResultSet rs) throws java.sql.SQLException { return new TokenPointConversionResponse(rs.getLong(1), rs.getString(2), rs.getString(3), rs.getBigDecimal(4), true, rs.getTimestamp(5).toLocalDateTime()); }
    private String platform(String value) { String normalized = required(value, "platformCode").toUpperCase(Locale.ROOT); if (!PLATFORMS.contains(normalized)) throw new IllegalArgumentException("unsupported platform"); return normalized; }
    private String tokenUnit(String platform) { return platform + "_DIAMOND"; }
    private String required(String value, String field) { if (value == null || value.isBlank()) throw new IllegalArgumentException(field + " is required"); return value.trim(); }
    private void audit(AdminSessionService.AdminPrincipal actor, long id, TokenPointConversionResponse before, TokenPointConversionResponse after) { audits.save(OperationAuditLog.create(actor.accountId(), actor.role(), MODULE, "token_point_conversion", id, "SAVE_PERMANENT_CONFIG", snapshot(before), snapshot(after), null, "保存长期代币积分换算配置；不会追溯记分或改变用户等级", LocalDateTime.now(clock))); }
    private String snapshot(TokenPointConversionResponse value) { return "platform=" + value.platformCode() + ";unit=" + value.tokenUnit() + ";pointsPerToken=" + value.pointsPerToken() + ";configured=" + value.configured(); }
}
