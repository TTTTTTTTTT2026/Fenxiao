package com.fenxiao.incentive.service;

import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.incentive.dto.EffectiveUserCorrectionRequest;
import com.fenxiao.incentive.dto.EffectiveUserQualificationResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Builds a local, revision-aware effective-user fact from MCN BOUND_FINAL income.
 * It has no dependency on rewards, wallets, withdrawals, or payment services.
 */
@Service
@Transactional
public class EffectiveUserQualificationService {
    private static final String MODULE = "effective_user";
    private final JdbcTemplate jdbc;
    private final OperationAuditLogRepository audits;
    private final Clock clock;

    public EffectiveUserQualificationService(JdbcTemplate jdbc, OperationAuditLogRepository audits, Clock clock) {
        this.jdbc = jdbc;
        this.audits = audits;
        this.clock = clock;
    }

    public int refreshPlatform(String platformCode) {
        String platform = platform(platformCode);
        return refresh(platform, null);
    }

    public int refreshDirectInvitees(long inviterUserId, String platformCode) {
        String platform = platform(platformCode);
        return refresh(platform, inviterUserId);
    }

    @Transactional(readOnly = true)
    public int qualifiedDirectInviteCount(long inviterUserId, String platformCode, LocalDateTime now) {
        Integer value = jdbc.queryForObject("""
                select count(*) from effective_user_qualification_fact f
                join invitation_relation_version i on i.user_id=f.user_id
                where i.inviter_user_id=? and i.effective_from<=? and (i.effective_to is null or i.effective_to>?)
                  and f.platform_code=? and f.qualification_status='QUALIFIED'
                """, Integer.class, inviterUserId, now, now, platform(platformCode));
        return value == null ? 0 : value;
    }

    @Transactional(readOnly = true)
    public List<EffectiveUserQualificationResponse> recent(String platformCode, int limit) {
        String platform = platform(platformCode);
        int safeLimit = Math.max(1, Math.min(limit, 100));
        return jdbc.query(select() + " where platform_code=? order by evaluated_at desc,id desc limit ?", (rs, row) -> map(rs), platform, safeLimit);
    }

    public EffectiveUserQualificationResponse exclude(EffectiveUserCorrectionRequest request, AdminSessionService.AdminPrincipal actor) {
        String platform = platform(request.platformCode());
        String reason = correctionReason(request.correctionReason());
        EffectiveUserQualificationResponse before = requiredFact(request.userId(), platform);
        LocalDateTime now = LocalDateTime.now(clock);
        jdbc.update("update effective_user_qualification_fact set qualification_status='MANUALLY_EXCLUDED',manual_correction_reason=?,manual_correction_note=?,corrected_by=?,corrected_at=?,evaluated_at=? where user_id=? and platform_code=?",
                reason, required(request.correctionNote(), "correctionNote"), actor.accountId(), now, now, request.userId(), platform);
        markInvitersForManualGradeReview(request.userId(), platform, now);
        EffectiveUserQualificationResponse after = requiredFact(request.userId(), platform);
        audits.save(OperationAuditLog.create(actor.accountId(), actor.role(), MODULE, "effective_user_qualification", before.userId(), "MANUAL_EXCLUDE",
                snapshot(before), snapshot(after), null, "仅用于已确认的刷号、虚假收入或伪造业绩；不会生成奖励或付款", now));
        return after;
    }

    private int refresh(String platform, Long inviterUserId) {
        Map<Long, List<IncomeEvidence>> byUser = new LinkedHashMap<>();
        String scope = inviterUserId == null ? "" : " and p.resolved_user_id in (select user_id from invitation_relation_version where inviter_user_id=? and effective_to is null)";
        List<IncomeEvidence> evidence = jdbc.query("""
                select p.resolved_user_id,r.occurred_at,r.source_event_id,r.source_revision
                from mcn_income_shadow_ledger_projection p
                join mcn_income_raw_ledger_event r on r.id=p.raw_ledger_event_id
                where p.platform_code=? and p.shadow_status='BOUND_FINAL' and p.resolved_user_id is not null
                """ + scope + " order by p.resolved_user_id,r.occurred_at,r.source_event_id", (rs, row) -> new IncomeEvidence(rs.getLong(1), rs.getTimestamp(2).toInstant(), rs.getString(3), rs.getString(4)), inviterUserId == null ? new Object[]{platform} : new Object[]{platform, inviterUserId});
        evidence.forEach(item -> byUser.computeIfAbsent(item.userId(), ignored -> new ArrayList<>()).add(item));
        String factScope = inviterUserId == null ? "" : " and f.user_id in (select user_id from invitation_relation_version where inviter_user_id=? and effective_to is null)";
        List<Long> existingUsers = jdbc.query("select f.user_id from effective_user_qualification_fact f where f.platform_code=?" + factScope,
                (rs, row) -> rs.getLong(1), inviterUserId == null ? new Object[]{platform} : new Object[]{platform, inviterUserId});
        existingUsers.forEach(userId -> byUser.putIfAbsent(userId, new ArrayList<>()));
        int refreshed = 0;
        for (Map.Entry<Long, List<IncomeEvidence>> entry : byUser.entrySet()) {
            upsert(platform, entry.getKey(), entry.getValue());
            refreshed++;
        }
        return refreshed;
    }

    private void upsert(String platform, long userId, List<IncomeEvidence> income) {
        Existing existing = existing(userId, platform);
        LocalDateTime now = LocalDateTime.now(clock);
        if (income.isEmpty()) {
            if (existing != null && existing.manualCorrectionReason() == null) {
                String status = "QUALIFIED".equals(existing.status()) ? "EVIDENCE_REVOKED" : "NOT_QUALIFIED";
                jdbc.update("update effective_user_qualification_fact set qualification_status=?,qualifying_income_date_count=0,qualifying_income_dates='',latest_income_at=null,evidence_revoked_at=?,evaluated_at=? where user_id=? and platform_code=?",
                        status, "EVIDENCE_REVOKED".equals(status) ? now : null, now, userId, platform);
            }
            return;
        }
        income.sort(Comparator.comparing(IncomeEvidence::occurredAt));
        IncomeEvidence first = income.getFirst();
        Instant windowEnd = first.occurredAt().plusSeconds(7 * 24 * 60 * 60L);
        List<LocalDate> dates = income.stream().filter(item -> item.occurredAt().isBefore(windowEnd))
                .map(item -> item.occurredAt().atOffset(ZoneOffset.UTC).toLocalDate()).distinct().sorted().toList();
        if (existing != null && existing.manualCorrectionReason() != null) {
            jdbc.update("update effective_user_qualification_fact set first_income_at=?,observation_ends_at=?,qualifying_income_date_count=?,qualifying_income_dates=?,latest_income_at=?,source_evidence_snapshot=?,evaluated_at=? where user_id=? and platform_code=?",
                    Timestamp.from(first.occurredAt()), Timestamp.from(windowEnd), dates.size(), joinDates(dates), Timestamp.from(income.getLast().occurredAt()), snapshotEvidence(income), now, first.userId(), platform);
            return;
        }
        String incoming = Instant.now(clock).isBefore(windowEnd) ? "OBSERVING" : dates.size() >= 3 ? "QUALIFIED" : "NOT_QUALIFIED";
        if (existing != null && "QUALIFIED".equals(existing.status()) && !"QUALIFIED".equals(incoming)) incoming = "EVIDENCE_REVOKED";
        LocalDateTime qualifiedAt = "QUALIFIED".equals(incoming) ? (existing != null && existing.qualifiedAt() != null ? existing.qualifiedAt() : now) : null;
        LocalDateTime revokedAt = "EVIDENCE_REVOKED".equals(incoming) ? now : null;
        int changed = jdbc.update("update effective_user_qualification_fact set qualification_status=?,first_income_at=?,observation_ends_at=?,qualifying_income_date_count=?,qualifying_income_dates=?,latest_income_at=?,source_evidence_snapshot=?,qualified_at=?,evidence_revoked_at=?,evaluated_at=? where user_id=? and platform_code=?",
                incoming, Timestamp.from(first.occurredAt()), Timestamp.from(windowEnd), dates.size(), joinDates(dates), Timestamp.from(income.getLast().occurredAt()), snapshotEvidence(income), qualifiedAt, revokedAt, now, first.userId(), platform);
        if (changed == 0) jdbc.update("insert into effective_user_qualification_fact(user_id,platform_code,qualification_status,first_income_at,observation_ends_at,qualifying_income_date_count,qualifying_income_dates,latest_income_at,source_evidence_snapshot,qualified_at,evidence_revoked_at,evaluated_at) values(?,?,?,?,?,?,?,?,?,?,?,?)",
                first.userId(), platform, incoming, Timestamp.from(first.occurredAt()), Timestamp.from(windowEnd), dates.size(), joinDates(dates), Timestamp.from(income.getLast().occurredAt()), snapshotEvidence(income), qualifiedAt, revokedAt, now);
    }

    private Existing existing(long userId, String platform) {
        List<Existing> values = jdbc.query("select qualification_status,qualified_at,manual_correction_reason from effective_user_qualification_fact where user_id=? and platform_code=?", (rs, row) -> new Existing(rs.getString(1), rs.getTimestamp(2) == null ? null : rs.getTimestamp(2).toLocalDateTime(), rs.getString(3)), userId, platform);
        return values.isEmpty() ? null : values.getFirst();
    }

    private EffectiveUserQualificationResponse requiredFact(long userId, String platform) {
        List<EffectiveUserQualificationResponse> values = jdbc.query(select() + " where user_id=? and platform_code=?", (rs, row) -> map(rs), userId, platform);
        if (values.isEmpty()) throw new IllegalArgumentException("effective-user qualification fact not found");
        return values.getFirst();
    }

    private String select() { return "select user_id,platform_code,qualification_status,first_income_at,observation_ends_at,qualifying_income_date_count,qualifying_income_dates,latest_income_at,source_evidence_snapshot,qualified_at,evidence_revoked_at,manual_correction_reason,manual_correction_note,corrected_by,corrected_at,evaluated_at from effective_user_qualification_fact"; }
    private EffectiveUserQualificationResponse map(java.sql.ResultSet rs) throws java.sql.SQLException { return new EffectiveUserQualificationResponse(rs.getLong(1), rs.getString(2), rs.getString(3), time(rs, 4), time(rs, 5), rs.getInt(6), rs.getString(7), time(rs, 8), rs.getString(9), time(rs, 10), time(rs, 11), rs.getString(12), rs.getString(13), nullableLong(rs, 14), time(rs, 15), time(rs, 16)); }
    private LocalDateTime time(java.sql.ResultSet rs, int index) throws java.sql.SQLException { return rs.getTimestamp(index) == null ? null : rs.getTimestamp(index).toLocalDateTime(); }
    private Long nullableLong(java.sql.ResultSet rs, int index) throws java.sql.SQLException { long value = rs.getLong(index); return rs.wasNull() ? null : value; }
    private String joinDates(List<LocalDate> dates) { return dates.stream().map(LocalDate::toString).reduce((left, right) -> left + "," + right).orElse(""); }
    private void markInvitersForManualGradeReview(long userId, String platform, LocalDateTime now) {
        jdbc.update("""
                update user_grade_evaluation
                set qualification_status='REQUIRES_MANUAL_REVIEW',evaluated_at=?
                where platform_code=? and qualification_status='QUALIFIED'
                  and user_id in (select inviter_user_id from invitation_relation_version where user_id=? and effective_to is null)
                """, now, platform, userId);
    }
    private String snapshotEvidence(List<IncomeEvidence> income) {
        StringBuilder result = new StringBuilder();
        for (IncomeEvidence item : income.stream().limit(20).toList()) {
            String entry = item.sourceEventId() + "@" + (item.sourceRevision() == null ? "-" : item.sourceRevision());
            if (result.length() + entry.length() + (result.isEmpty() ? 0 : 1) > 1000) break;
            if (!result.isEmpty()) result.append(',');
            result.append(entry);
        }
        return result.toString();
    }
    private String snapshot(EffectiveUserQualificationResponse value) { return "user=" + value.userId() + ";platform=" + value.platformCode() + ";status=" + value.qualificationStatus() + ";dates=" + value.qualifyingIncomeDates() + ";correction=" + value.manualCorrectionReason(); }
    private String platform(String value) { String normalized = required(value, "platformCode").toUpperCase(Locale.ROOT); if (!"TIMO".equals(normalized) && !"LINKY".equals(normalized)) throw new IllegalArgumentException("unsupported platform"); return normalized; }
    private String correctionReason(String value) { String normalized = required(value, "correctionReason").toUpperCase(Locale.ROOT); if (!List.of("FRAUD", "FAKE_INCOME", "FABRICATED_PERFORMANCE").contains(normalized)) throw new IllegalArgumentException("correctionReason must be FRAUD, FAKE_INCOME or FABRICATED_PERFORMANCE"); return normalized; }
    private String required(String value, String name) { if (value == null || value.isBlank()) throw new IllegalArgumentException(name + " is required"); return value.trim(); }
    private record IncomeEvidence(long userId, Instant occurredAt, String sourceEventId, String sourceRevision) { }
    private record Existing(String status, LocalDateTime qualifiedAt, String manualCorrectionReason) { }
}
