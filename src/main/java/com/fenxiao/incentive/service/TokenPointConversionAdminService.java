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

/** Versioned conversion configuration; it is not a point accrual job. */
@Service
@Transactional
public class TokenPointConversionAdminService {
    private static final String MODULE = "token_point_conversion";
    private final JdbcTemplate jdbc;
    private final OperationAuditLogRepository audits;
    private final Clock clock;

    public TokenPointConversionAdminService(JdbcTemplate jdbc, OperationAuditLogRepository audits, Clock clock) {
        this.jdbc = jdbc; this.audits = audits; this.clock = clock;
    }

    @Transactional(readOnly = true)
    public TokenPointConversionDashboardResponse dashboard() {
        List<TokenPointConversionResponse> values = conversions();
        return new TokenPointConversionDashboardResponse(values.stream().filter(value -> "ACTIVE".equals(value.status())).count(), values);
    }

    @Transactional(readOnly = true)
    public List<TokenPointConversionResponse> conversions() {
        return jdbc.query(select() + " order by platform_code,effective_from desc,id desc", (rs, row) -> map(rs));
    }

    public TokenPointConversionResponse createDraft(TokenPointConversionRequest request, AdminSessionService.AdminPrincipal actor) {
        validate(request);
        String platform = platform(request.platformCode());
        String code = "TPC-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT);
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("insert into token_point_conversion_version(conversion_code,conversion_version,platform_code,token_unit,points_per_token,effective_from,effective_to,rule_status,created_by) values(?,1,?,?,?,?,?,?,'DRAFT',?)", new String[]{"id"});
            statement.setString(1, code); statement.setString(2, platform); statement.setString(3, tokenUnit(platform));
            statement.setBigDecimal(4, request.pointsPerToken()); statement.setObject(5, request.effectiveFrom()); statement.setObject(6, request.effectiveTo()); statement.setLong(7, actor.accountId());
            return statement;
        }, keys);
        TokenPointConversionResponse created = conversion(Objects.requireNonNull(keys.getKey()).longValue());
        audit(actor, created.id(), "CREATE_DRAFT", null, snapshot(created), "建立代币积分换算草稿；不会追溯记分或改变用户等级");
        return created;
    }

    public TokenPointConversionResponse activate(long id, String note, AdminSessionService.AdminPrincipal actor) {
        TokenPointConversionResponse current = conversion(id);
        if (!"DRAFT".equals(current.status())) throw new IllegalStateException("only draft token point conversion can be activated");
        ensureNoOverlap(current);
        jdbc.update("update token_point_conversion_version set rule_status='ACTIVE',approved_by=?,approved_at=?,approval_note=? where id=?", actor.accountId(), LocalDateTime.now(clock), required(note, "approvalNote"), id);
        TokenPointConversionResponse updated = conversion(id);
        audit(actor, id, "ACTIVATE", snapshot(current), snapshot(updated), "审批启用代币积分换算；仅供后续直接下级收入积分计算使用");
        return updated;
    }

    public TokenPointConversionResponse retire(long id, AdminSessionService.AdminPrincipal actor) {
        TokenPointConversionResponse current = conversion(id);
        if (!"ACTIVE".equals(current.status())) throw new IllegalStateException("only active token point conversion can be retired");
        jdbc.update("update token_point_conversion_version set rule_status='RETIRED',effective_to=coalesce(effective_to,?) where id=?", LocalDateTime.now(clock), id);
        TokenPointConversionResponse updated = conversion(id);
        audit(actor, id, "RETIRE", snapshot(current), snapshot(updated), "停止代币积分换算；不会改写后续积分流水或已获得等级");
        return updated;
    }

    private void ensureNoOverlap(TokenPointConversionResponse candidate) {
        for (TokenPointConversionResponse other : conversions()) {
            if (other.id() == candidate.id() || !"ACTIVE".equals(other.status()) || !other.platformCode().equals(candidate.platformCode())) continue;
            boolean overlap = (other.effectiveTo() == null || !candidate.effectiveFrom().isAfter(other.effectiveTo()))
                    && (candidate.effectiveTo() == null || !other.effectiveFrom().isAfter(candidate.effectiveTo()));
            if (overlap) throw new IllegalStateException("an active token point conversion already overlaps this platform and period");
        }
    }

    private void validate(TokenPointConversionRequest request) {
        platform(request.platformCode());
        if (request.pointsPerToken() == null || request.pointsPerToken().compareTo(BigDecimal.ZERO) < 0) throw new IllegalArgumentException("pointsPerToken must not be negative");
        if (request.effectiveTo() != null && request.effectiveTo().isBefore(request.effectiveFrom())) throw new IllegalArgumentException("effectiveTo must not be before effectiveFrom");
    }

    private TokenPointConversionResponse conversion(long id) {
        List<TokenPointConversionResponse> values = jdbc.query(select() + " where id=?", (rs, row) -> map(rs), id);
        if (values.isEmpty()) throw new IllegalArgumentException("token point conversion not found");
        return values.getFirst();
    }

    private String select() { return "select id,conversion_code,conversion_version,platform_code,token_unit,points_per_token,effective_from,effective_to,rule_status,created_by,approved_by,approved_at,approval_note from token_point_conversion_version"; }
    private TokenPointConversionResponse map(java.sql.ResultSet rs) throws java.sql.SQLException { return new TokenPointConversionResponse(rs.getLong(1), rs.getString(2), rs.getInt(3), rs.getString(4), rs.getString(5), rs.getBigDecimal(6), rs.getTimestamp(7).toLocalDateTime(), rs.getTimestamp(8) == null ? null : rs.getTimestamp(8).toLocalDateTime(), rs.getString(9), nullableLong(rs, 10), nullableLong(rs, 11), rs.getTimestamp(12) == null ? null : rs.getTimestamp(12).toLocalDateTime(), rs.getString(13)); }
    private Long nullableLong(java.sql.ResultSet rs, int index) throws java.sql.SQLException { long value = rs.getLong(index); return rs.wasNull() ? null : value; }
    private String platform(String value) { String normalized = required(value, "platformCode").toUpperCase(Locale.ROOT); if (!"TIMO".equals(normalized) && !"LINKY".equals(normalized)) throw new IllegalArgumentException("unsupported platform"); return normalized; }
    private String tokenUnit(String platform) { return platform + "_DIAMOND"; }
    private String required(String value, String field) { if (value == null || value.isBlank()) throw new IllegalArgumentException(field + " is required"); return value.trim(); }
    private void audit(AdminSessionService.AdminPrincipal actor, long id, String action, String before, String after, String remark) { audits.save(OperationAuditLog.create(actor.accountId(), actor.role(), MODULE, "token_point_conversion", id, action, before, after, null, remark, LocalDateTime.now(clock))); }
    private String snapshot(TokenPointConversionResponse value) { return "code=" + value.conversionCode() + ";platform=" + value.platformCode() + ";unit=" + value.tokenUnit() + ";pointsPerToken=" + value.pointsPerToken() + ";status=" + value.status(); }
}
