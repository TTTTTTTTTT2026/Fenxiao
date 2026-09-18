package com.fenxiao.incentive.service;

import com.fenxiao.incentive.dto.UserPointBalanceResponse;
import com.fenxiao.incentive.dto.UserPointDashboardResponse;
import com.fenxiao.incentive.dto.UserPointFactResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Converts a direct invitee's local BOUND_FINAL income into point evidence.
 * The source is never a reward candidate: it is the MCN original settled amount
 * already retained in BANDEIRA's shadow ledger.  There are no payment side effects.
 */
@Service
@Transactional
public class UserPointFactService {
    private static final String SOURCE_SYSTEM = "MCN_INCOME_V1";
    private final JdbcTemplate jdbc;
    private final Clock clock;

    public UserPointFactService(JdbcTemplate jdbc, Clock clock) {
        this.jdbc = jdbc;
        this.clock = clock;
    }

    /** Rebuilds only local point evidence for one platform; it does not call MCN. */
    public int refresh(String platformCode) {
        String platform = platform(platformCode);
        LocalDateTime now = LocalDateTime.now(clock);
        // A source fact missing from the current BOUND_FINAL projection must not keep
        // contributing points.  Its former point evidence stays visible as revoked.
        jdbc.update("update user_direct_invitee_point_fact set fact_status='EVIDENCE_REVOKED',decision_reason='source income is no longer a bound final fact',projected_at=? where source_system=? and platform_code=? and fact_status='ACCRUED'",
                now, SOURCE_SYSTEM, platform);
        List<IncomeInput> inputs = jdbc.query("""
                select p.source_event_id,p.raw_ledger_event_id,p.source_revision,p.resolved_user_id,
                       r.amount,r.amount_unit,r.occurred_at
                from mcn_income_shadow_ledger_projection p
                join mcn_income_raw_ledger_event r on r.id=p.raw_ledger_event_id
                where p.source_system=? and p.platform_code=? and p.shadow_status='BOUND_FINAL'
                  and p.resolved_user_id is not null
                order by p.source_event_id
                """, (rs, row) -> new IncomeInput(rs.getString(1), rs.getLong(2), rs.getString(3), rs.getLong(4),
                rs.getBigDecimal(5), rs.getString(6), rs.getTimestamp(7).toInstant()), SOURCE_SYSTEM, platform);
        for (IncomeInput input : inputs) project(platform, input, now);
        rebuildBalances(now);
        return inputs.size();
    }

    @Transactional(readOnly = true)
    public UserPointDashboardResponse dashboard(String platformCode, int limit) {
        String platform = platform(platformCode);
        int safeLimit = Math.max(1, Math.min(limit, 100));
        long accrued = count("select count(*) from user_direct_invitee_point_fact where source_system=? and platform_code=? and fact_status='ACCRUED'", platform);
        long blocked = count("select count(*) from user_direct_invitee_point_fact where source_system=? and platform_code=? and fact_status like 'BLOCKED_%'", platform);
        long revoked = count("select count(*) from user_direct_invitee_point_fact where source_system=? and platform_code=? and fact_status='EVIDENCE_REVOKED'", platform);
        BigDecimal total = amount("select coalesce(sum(point_amount),0) from user_direct_invitee_point_fact where source_system=? and platform_code=? and fact_status='ACCRUED'", platform);
        List<UserPointBalanceResponse> balances = jdbc.query("select user_id,total_points,accrued_fact_count,latest_income_at,evaluated_at from user_point_balance_projection order by total_points desc,user_id asc limit ?", (rs, row) -> new UserPointBalanceResponse(rs.getLong(1), rs.getBigDecimal(2), rs.getInt(3), time(rs, 4), time(rs, 5)), safeLimit);
        List<UserPointFactResponse> facts = jdbc.query(select() + " where source_system=? and platform_code=? order by occurred_at desc,source_event_id desc limit ?", (rs, row) -> map(rs), SOURCE_SYSTEM, platform, safeLimit);
        return new UserPointDashboardResponse(platform, accrued, blocked, revoked, total, balances, facts);
    }

    private void project(String platform, IncomeInput input, LocalDateTime now) {
        LocalDateTime occurredAt = LocalDateTime.ofInstant(input.occurredAt(), ZoneOffset.UTC);
        Optional<DirectInvitation> relation = directInvitationAt(input.sourceUserId(), occurredAt);
        if (relation.isEmpty() || relation.get().inviterUserId() == null) {
            save(platform, input, null, relation.map(DirectInvitation::versionNo).orElse(null), null, null, null,
                    "BLOCKED_NO_DIRECT_INVITER", "no time-effective direct inviter at income occurrence time", now);
            return;
        }
        Optional<Conversion> conversion = conversionAt(platform, occurredAt);
        if (conversion.isEmpty()) {
            save(platform, input, relation.get().inviterUserId(), relation.get().versionNo(), null, null, null,
                    "BLOCKED_NO_CONVERSION", "no token-to-points configuration effective at income occurrence time", now);
            return;
        }
        Conversion value = conversion.get();
        BigDecimal points = input.amount().multiply(value.pointsPerToken()).setScale(6, RoundingMode.HALF_UP);
        save(platform, input, relation.get().inviterUserId(), relation.get().versionNo(), value.id(), value.pointsPerToken(), points,
                "ACCRUED", "bound final income, direct invitation snapshot and conversion snapshot matched", now);
    }

    private Optional<DirectInvitation> directInvitationAt(long userId, LocalDateTime occurredAt) {
        List<DirectInvitation> values = jdbc.query("""
                select inviter_user_id,version_no from invitation_relation_version
                where user_id=? and effective_from<=? and (effective_to is null or effective_to>?)
                order by version_no desc limit 1
                """, (rs, row) -> new DirectInvitation(nullableLong(rs, 1), rs.getInt(2)), userId, occurredAt, occurredAt);
        return values.stream().findFirst();
    }

    private Optional<Conversion> conversionAt(String platform, LocalDateTime occurredAt) {
        List<Conversion> values = jdbc.query("""
                select id,points_per_token from token_point_conversion_version
                where platform_code=? and rule_status in ('ACTIVE','RETIRED') and effective_from<=?
                  and (effective_to is null or effective_to>?)
                order by effective_from desc,id desc limit 1
                """, (rs, row) -> new Conversion(rs.getLong(1), rs.getBigDecimal(2)), platform, occurredAt, occurredAt);
        return values.stream().findFirst();
    }

    private void save(String platform, IncomeInput input, Long beneficiaryId, Integer invitationVersionNo, Long conversionId,
                      BigDecimal pointsPerToken, BigDecimal pointAmount, String status, String reason, LocalDateTime now) {
        Integer existing = jdbc.queryForObject("select count(*) from user_direct_invitee_point_fact where source_system=? and platform_code=? and source_event_id=?",
                Integer.class, SOURCE_SYSTEM, platform, input.sourceEventId());
        if (existing != null && existing > 0) {
            jdbc.update("""
                    update user_direct_invitee_point_fact set raw_ledger_event_id=?,source_revision=?,source_user_id=?,beneficiary_user_id=?,
                    invitation_version_no=?,conversion_id=?,token_unit=?,source_amount=?,points_per_token=?,point_amount=?,occurred_at=?,
                    fact_status=?,decision_reason=?,projected_at=?
                    where source_system=? and platform_code=? and source_event_id=?
                    """, input.rawLedgerEventId(), input.sourceRevision(), input.sourceUserId(), beneficiaryId, invitationVersionNo, conversionId,
                    input.tokenUnit(), input.amount(), pointsPerToken, pointAmount, Timestamp.from(input.occurredAt()), status, reason, now,
                    SOURCE_SYSTEM, platform, input.sourceEventId());
            return;
        }
        jdbc.update("""
                insert into user_direct_invitee_point_fact
                (source_system,platform_code,source_event_id,raw_ledger_event_id,source_revision,source_user_id,beneficiary_user_id,
                 invitation_version_no,conversion_id,token_unit,source_amount,points_per_token,point_amount,occurred_at,fact_status,decision_reason,projected_at)
                values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                """, SOURCE_SYSTEM, platform, input.sourceEventId(), input.rawLedgerEventId(), input.sourceRevision(), input.sourceUserId(), beneficiaryId,
                invitationVersionNo, conversionId, input.tokenUnit(), input.amount(), pointsPerToken, pointAmount, Timestamp.from(input.occurredAt()), status, reason, now);
    }

    private void rebuildBalances(LocalDateTime now) {
        jdbc.update("update user_point_balance_projection set total_points=0,accrued_fact_count=0,latest_income_at=null,evaluated_at=?", now);
        List<Balance> balances = jdbc.query("""
                select beneficiary_user_id,coalesce(sum(point_amount),0),count(*),max(occurred_at)
                from user_direct_invitee_point_fact
                where source_system=? and fact_status='ACCRUED' and beneficiary_user_id is not null
                group by beneficiary_user_id
                """, (rs, row) -> new Balance(rs.getLong(1), rs.getBigDecimal(2), rs.getInt(3), rs.getTimestamp(4).toLocalDateTime()), SOURCE_SYSTEM);
        for (Balance balance : balances) {
            Integer exists = jdbc.queryForObject("select count(*) from user_point_balance_projection where user_id=?", Integer.class, balance.userId());
            if (exists != null && exists > 0) jdbc.update("update user_point_balance_projection set total_points=?,accrued_fact_count=?,latest_income_at=?,evaluated_at=? where user_id=?",
                    balance.points(), balance.factCount(), balance.latestIncomeAt(), now, balance.userId());
            else jdbc.update("insert into user_point_balance_projection(user_id,total_points,accrued_fact_count,latest_income_at,evaluated_at) values(?,?,?,?,?)",
                    balance.userId(), balance.points(), balance.factCount(), balance.latestIncomeAt(), now);
        }
    }

    private String select() { return "select platform_code,source_event_id,source_user_id,beneficiary_user_id,invitation_version_no,conversion_id,token_unit,source_amount,points_per_token,point_amount,occurred_at,fact_status,decision_reason,projected_at from user_direct_invitee_point_fact"; }
    private UserPointFactResponse map(java.sql.ResultSet rs) throws java.sql.SQLException { return new UserPointFactResponse(rs.getString(1), rs.getString(2), nullableLong(rs, 3), nullableLong(rs, 4), nullableInt(rs, 5), nullableLong(rs, 6), rs.getString(7), rs.getBigDecimal(8), rs.getBigDecimal(9), rs.getBigDecimal(10), time(rs, 11), rs.getString(12), rs.getString(13), time(rs, 14)); }
    private long count(String sql, String platform) { Long value = jdbc.queryForObject(sql, Long.class, SOURCE_SYSTEM, platform); return value == null ? 0 : value; }
    private BigDecimal amount(String sql, String platform) { BigDecimal value = jdbc.queryForObject(sql, BigDecimal.class, SOURCE_SYSTEM, platform); return value == null ? BigDecimal.ZERO : value; }
    private LocalDateTime time(java.sql.ResultSet rs, int column) throws java.sql.SQLException { return rs.getTimestamp(column) == null ? null : rs.getTimestamp(column).toLocalDateTime(); }
    private Long nullableLong(java.sql.ResultSet rs, int column) throws java.sql.SQLException { long value = rs.getLong(column); return rs.wasNull() ? null : value; }
    private Integer nullableInt(java.sql.ResultSet rs, int column) throws java.sql.SQLException { int value = rs.getInt(column); return rs.wasNull() ? null : value; }
    private String platform(String value) { String normalized = value == null ? "" : value.trim().toUpperCase(Locale.ROOT); if (!"TIMO".equals(normalized) && !"LINKY".equals(normalized)) throw new IllegalArgumentException("unsupported platform"); return normalized; }
    private record IncomeInput(String sourceEventId, long rawLedgerEventId, String sourceRevision, long sourceUserId, BigDecimal amount, String tokenUnit, Instant occurredAt) { }
    private record DirectInvitation(Long inviterUserId, int versionNo) { }
    private record Conversion(long id, BigDecimal pointsPerToken) { }
    private record Balance(long userId, BigDecimal points, int factCount, LocalDateTime latestIncomeAt) { }
}
