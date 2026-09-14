package com.fenxiao.income.mcn.service;

import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.income.mcn.api.dto.McnIncomeShadowLedgerSummaryResponse;
import com.fenxiao.income.mcn.api.dto.McnIncomeDataQualityExceptionResponse;
import com.fenxiao.income.mcn.api.dto.McnIncomeDataQualityResponse;
import com.fenxiao.income.mcn.domain.McnIncomeEventType;
import com.fenxiao.income.mcn.domain.McnIncomeSettlementStatus;
import com.fenxiao.income.mcn.entity.McnIncomeDataQualityReview;
import com.fenxiao.income.mcn.entity.McnIncomeRawLedgerEvent;
import com.fenxiao.income.mcn.repository.McnIncomeDataQualityReviewRepository;
import com.fenxiao.income.mcn.repository.McnIncomeRawLedgerEventRepository;
import com.fenxiao.platform.domain.PlatformBindingStatus;
import com.fenxiao.platform.repository.PlatformAccountBindingRepository;
import jakarta.transaction.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * A non-financial projection over immutable MCN evidence. It never invokes reward, wallet,
 * withdrawal or payment services; its sole purpose is to make data completeness reviewable.
 */
@Service
@Transactional
public class McnIncomeShadowLedgerService {
    private static final String MODULE = "mcn_income_data_quality";
    private static final int BINDING_LOOKUP_BATCH_SIZE = 500;
    private static final int PROJECTION_WRITE_BATCH_SIZE = 500;
    private static final String UPSERT_PROJECTION = """
            INSERT INTO mcn_income_shadow_ledger_projection
            (source_system, platform_code, source_event_id, raw_ledger_event_id, source_revision, business_date, guild_id, resolved_user_id, settlement_status, event_type, amount, amount_unit, currency_code, shadow_status, source_updated_at, projected_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE raw_ledger_event_id=VALUES(raw_ledger_event_id), source_revision=VALUES(source_revision), business_date=VALUES(business_date), guild_id=VALUES(guild_id), resolved_user_id=VALUES(resolved_user_id), settlement_status=VALUES(settlement_status), event_type=VALUES(event_type), amount=VALUES(amount), amount_unit=VALUES(amount_unit), currency_code=VALUES(currency_code), shadow_status=VALUES(shadow_status), source_updated_at=VALUES(source_updated_at), projected_at=VALUES(projected_at)
            """;
    private final McnIncomeRawLedgerEventRepository rawEvents;
    private final PlatformAccountBindingRepository bindings;
    private final JdbcTemplate jdbc;
    private final Clock clock;
    private final McnIncomeDataQualityReviewRepository reviews;
    private final OperationAuditLogRepository audits;

    public McnIncomeShadowLedgerService(McnIncomeRawLedgerEventRepository rawEvents, PlatformAccountBindingRepository bindings, JdbcTemplate jdbc, Clock clock) {
        this(rawEvents, bindings, jdbc, clock, null, null);
    }

    @Autowired
    public McnIncomeShadowLedgerService(McnIncomeRawLedgerEventRepository rawEvents, PlatformAccountBindingRepository bindings,
                                        JdbcTemplate jdbc, Clock clock, McnIncomeDataQualityReviewRepository reviews,
                                        OperationAuditLogRepository audits) {
        this.rawEvents = rawEvents; this.bindings = bindings; this.jdbc = jdbc; this.clock = clock;
        this.reviews = reviews; this.audits = audits;
    }

    public McnIncomeShadowLedgerSummaryResponse refresh(String platformCode, LocalDate businessDate) {
        String platform = platform(platformCode);
        List<McnIncomeRawLedgerEvent> facts = rawEvents.findBySourceSystemAndPlatformCodeAndBusinessDateBetween("MCN", platform, businessDate, businessDate);
        Map<String, McnIncomeRawLedgerEvent> latest = new HashMap<>();
        for (McnIncomeRawLedgerEvent fact : facts) latest.merge(fact.getSourceEventId(), fact, this::newer);
        Counts counts = new Counts();
        Instant now = clock.instant();
        Map<String, Long> verifiedUsers = verifiedUsers(platform, latest.values());
        List<Object[]> projectionRows = new java.util.ArrayList<>(latest.size());
        for (McnIncomeRawLedgerEvent fact : latest.values()) {
            ProjectionDecision decision = decision(fact, verifiedUsers); counts.add(decision.status());
            projectionRows.add(new Object[]{fact.getSourceSystem(), platform, fact.getSourceEventId(), fact.getId(), fact.getSourceRevision(), businessDate,
                    fact.getGuildId(), decision.resolvedUserId(), fact.getSettlementStatus().name(), fact.getEventType().name(), fact.getAmount(),
                    fact.getAmountUnit(), fact.getCurrencyCode(), decision.status(), Timestamp.from(fact.getSourceUpdatedAt()), Timestamp.from(now)});
        }
        for (int start = 0; start < projectionRows.size(); start += PROJECTION_WRITE_BATCH_SIZE) {
            jdbc.batchUpdate(UPSERT_PROJECTION, projectionRows.subList(start, Math.min(start + PROJECTION_WRITE_BATCH_SIZE, projectionRows.size())));
        }
        String runId = UUID.randomUUID().toString();
        jdbc.update("INSERT INTO mcn_income_shadow_ledger_run (run_id, platform_code, business_date, source_fact_count, latest_fact_count, bound_final_count, unmatched_count, awaiting_finality_count, voided_count, started_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                runId, platform, businessDate, facts.size(), latest.size(), counts.boundFinal, counts.unmatched, counts.awaitingFinality, counts.voided, Timestamp.from(now), Timestamp.from(now));
        return response(platform, businessDate, facts.size(), latest.size(), counts, runId);
    }

    @Transactional
    public McnIncomeShadowLedgerSummaryResponse summary(String platformCode, LocalDate businessDate) {
        String platform = platform(platformCode);
        List<McnIncomeShadowLedgerSummaryResponse> rows = jdbc.query("SELECT source_fact_count, latest_fact_count, bound_final_count, unmatched_count, awaiting_finality_count, voided_count, run_id FROM mcn_income_shadow_ledger_run WHERE platform_code=? AND business_date=? ORDER BY id DESC LIMIT 1", (rs, row) -> new McnIncomeShadowLedgerSummaryResponse(platform, businessDate, rs.getInt(1), rs.getInt(2), rs.getInt(3), rs.getInt(4), rs.getInt(5), rs.getInt(6), rs.getString(7)), platform, businessDate);
        return rows.isEmpty() ? new McnIncomeShadowLedgerSummaryResponse(platform, businessDate, 0, 0, 0, 0, 0, 0, null) : rows.getFirst();
    }

    /**
     * Read-only quality evidence for operators. A projection is complete only when
     * every latest MCN fact for the selected day has a current shadow projection.
     */
    @Transactional
    public McnIncomeDataQualityResponse quality(String platformCode, LocalDate businessDate) {
        McnIncomeShadowLedgerSummaryResponse summary = summary(platformCode, businessDate);
        int projected = count("SELECT COUNT(*) FROM mcn_income_shadow_ledger_projection WHERE source_system='MCN' AND platform_code=? AND business_date=?", summary.platformCode(), businessDate);
        int bound = count("SELECT COUNT(*) FROM mcn_income_shadow_ledger_projection WHERE source_system='MCN' AND platform_code=? AND business_date=? AND shadow_status='BOUND_FINAL'", summary.platformCode(), businessDate);
        int unmatched = count("SELECT COUNT(*) FROM mcn_income_shadow_ledger_projection WHERE source_system='MCN' AND platform_code=? AND business_date=? AND shadow_status='UNMATCHED'", summary.platformCode(), businessDate);
        int awaiting = count("SELECT COUNT(*) FROM mcn_income_shadow_ledger_projection WHERE source_system='MCN' AND platform_code=? AND business_date=? AND shadow_status='AWAITING_FINALITY'", summary.platformCode(), businessDate);
        int voided = count("SELECT COUNT(*) FROM mcn_income_shadow_ledger_projection WHERE source_system='MCN' AND platform_code=? AND business_date=? AND shadow_status='VOIDED'", summary.platformCode(), businessDate);
        int latest = summary.latestFactCount();
        String projectionStatus = summary.latestRunId() == null ? "NOT_REFRESHED" : projected == latest ? "COMPLETE" : "INCOMPLETE";
        int coverage = latest == 0 ? 0 : Math.toIntExact(Math.round((bound * 100.0d) / latest));
        return new McnIncomeDataQualityResponse(summary.platformCode(), businessDate, latest, projected, bound, unmatched, awaiting, voided, coverage, projectionStatus, summary.latestRunId());
    }

    @Transactional
    public List<McnIncomeDataQualityExceptionResponse> exceptions(String platformCode, LocalDate businessDate, int limit) {
        String platform = platform(platformCode);
        int safeLimit = Math.max(1, Math.min(limit, 100));
        return jdbc.query("""
                SELECT source_event_id, business_date, guild_id, shadow_status, settlement_status, event_type, source_revision, source_updated_at
                FROM mcn_income_shadow_ledger_projection
                WHERE source_system='MCN' AND platform_code=? AND business_date=? AND shadow_status IN ('UNMATCHED', 'AWAITING_FINALITY')
                ORDER BY CASE shadow_status WHEN 'UNMATCHED' THEN 0 ELSE 1 END, source_updated_at DESC
                LIMIT ?
                """, (rs, row) -> responseWithReview(
                rs.getString(1), rs.getObject(2, LocalDate.class), rs.getString(3), rs.getString(4), rs.getString(5),
                rs.getString(6), rs.getString(7), rs.getTimestamp(8).toInstant(), platform), platform, businessDate, safeLimit);
    }

    /** Rebuilds only the local projection from already-retained MCN evidence; it never calls MCN or creates money. */
    public McnIncomeShadowLedgerSummaryResponse replay(String platformCode, LocalDate businessDate, String reason, AdminSessionService.AdminPrincipal actor) {
        String platform = platform(platformCode);
        String note = requiredNote(reason);
        McnIncomeShadowLedgerSummaryResponse result = refresh(platform, businessDate);
        audit(actor, "REPLAY_PROJECTION", "income_shadow_day", 0L, null,
                snapshot(platform, businessDate), note + "；僅重建本地影子投影，未呼叫 MCN、未產生獎勵或餘額");
        return result;
    }

    /** Acknowledgement is scoped to the exact source revision, preventing stale conclusions after MCN corrects a fact. */
    public McnIncomeDataQualityExceptionResponse review(String platformCode, LocalDate businessDate, String sourceEventReference,
                                                         String sourceRevision, String reviewStatus, String reviewNote,
                                                         AdminSessionService.AdminPrincipal actor) {
        if (reviews == null) throw new IllegalStateException("income quality review storage is unavailable");
        String platform = platform(platformCode), reference = required(sourceEventReference, "source event reference"), revision = required(sourceRevision, "source revision");
        String status = required(reviewStatus, "review status").toUpperCase(Locale.ROOT);
        if (!"ACKNOWLEDGED".equals(status) && !"IGNORED".equals(status)) throw new IllegalArgumentException("income review status is invalid");
        String note = requiredNote(reviewNote);
        ExceptionRow current = currentException(platform, businessDate, reference, revision);
        McnIncomeDataQualityReview review = reviews.findBySourceSystemAndPlatformCodeAndSourceEventIdAndSourceRevision("MCN", platform, reference, revision).orElse(null);
        String before = review == null ? null : "status=" + review.getReviewStatus() + ",note=" + review.getReviewNote();
        Instant now = clock.instant();
        if (review == null) review = McnIncomeDataQualityReview.create("MCN", platform, reference, revision, status, note, actor.accountId(), actor.role(), now);
        else review.update(status, note, actor.accountId(), actor.role(), now);
        review = reviews.save(review);
        audit(actor, "REVIEW_EXCEPTION", "income_data_quality_review", review.getId(), before,
                "status=" + status + ",source=" + reference + ",revision=" + revision, note);
        return new McnIncomeDataQualityExceptionResponse(reference, current.businessDate, current.guildId, current.shadowStatus,
                current.settlementStatus, current.eventType, revision, current.sourceUpdatedAt, review.getReviewStatus(),
                review.getReviewNote(), review.getReviewedBy(), review.getReviewedAt());
    }

    private int count(String sql, String platform, LocalDate businessDate) {
        Integer result = jdbc.queryForObject(sql, Integer.class, platform, businessDate);
        return result == null ? 0 : result;
    }
    private McnIncomeDataQualityExceptionResponse responseWithReview(String reference, LocalDate businessDate, String guildId,
                                                                       String shadowStatus, String settlementStatus, String eventType,
                                                                       String revision, Instant sourceUpdatedAt, String platform) {
        McnIncomeDataQualityReview review = reviews == null ? null : reviews.findBySourceSystemAndPlatformCodeAndSourceEventIdAndSourceRevision("MCN", platform, reference, revision).orElse(null);
        return new McnIncomeDataQualityExceptionResponse(reference, businessDate, guildId, shadowStatus, settlementStatus, eventType,
                revision, sourceUpdatedAt, review == null ? "PENDING" : review.getReviewStatus(), review == null ? null : review.getReviewNote(),
                review == null ? null : review.getReviewedBy(), review == null ? null : review.getReviewedAt());
    }
    private ExceptionRow currentException(String platform, LocalDate businessDate, String reference, String revision) {
        List<ExceptionRow> rows = jdbc.query("""
                SELECT business_date, guild_id, shadow_status, settlement_status, event_type, source_updated_at
                FROM mcn_income_shadow_ledger_projection
                WHERE source_system='MCN' AND platform_code=? AND business_date=? AND source_event_id=? AND source_revision=?
                  AND shadow_status IN ('UNMATCHED', 'AWAITING_FINALITY')
                """, (rs, row) -> new ExceptionRow(rs.getObject(1, LocalDate.class), rs.getString(2), rs.getString(3),
                rs.getString(4), rs.getString(5), rs.getTimestamp(6).toInstant()), platform, businessDate, reference, revision);
        if (rows.isEmpty()) throw new IllegalStateException("income fact is no longer an actionable current exception");
        return rows.getFirst();
    }
    private void audit(AdminSessionService.AdminPrincipal actor, String action, String targetType, Long targetId,
                       String before, String after, String remark) {
        if (audits == null) return;
        audits.save(OperationAuditLog.create(actor.accountId(), actor.role(), MODULE, targetType, targetId, action,
                before, after, null, remark, java.time.LocalDateTime.now(clock)));
    }
    private String snapshot(String platform, LocalDate date) { return "platform=" + platform + ",businessDate=" + date; }
    private String required(String value, String label) { if (value == null || value.isBlank()) throw new IllegalArgumentException(label + " is required"); return value.trim(); }
    private String requiredNote(String value) { String note = required(value, "review note"); if (note.length() > 255) throw new IllegalArgumentException("review note must be at most 255 characters"); return note; }

    private McnIncomeRawLedgerEvent newer(McnIncomeRawLedgerEvent left, McnIncomeRawLedgerEvent right) {
        Comparator<McnIncomeRawLedgerEvent> order = Comparator.comparing(McnIncomeRawLedgerEvent::getSourceUpdatedAt).thenComparing(McnIncomeRawLedgerEvent::getSourceRevision);
        return order.compare(left, right) >= 0 ? left : right;
    }
    private Map<String, Long> verifiedUsers(String platform, java.util.Collection<McnIncomeRawLedgerEvent> facts) {
        List<String> accountIds = new java.util.ArrayList<>(new HashSet<>(facts.stream().map(McnIncomeRawLedgerEvent::getPlatformUserId).toList()));
        Map<String, Long> result = new HashMap<>();
        for (int start = 0; start < accountIds.size(); start += BINDING_LOOKUP_BATCH_SIZE) {
            List<String> batch = accountIds.subList(start, Math.min(start + BINDING_LOOKUP_BATCH_SIZE, accountIds.size()));
            for (var binding : bindings.findByPlatformCodeAndPlatformUserIdIn(platform, batch)) {
                if (binding.getBindingStatus() == PlatformBindingStatus.VERIFIED) result.put(binding.getPlatformUserId(), binding.getUserId());
            }
        }
        return result;
    }
    private ProjectionDecision decision(McnIncomeRawLedgerEvent fact, Map<String, Long> verifiedUsers) {
        Long resolvedUserId = verifiedUsers.get(fact.getPlatformUserId());
        if (resolvedUserId == null) return new ProjectionDecision("UNMATCHED", null);
        if (fact.getEventType() == McnIncomeEventType.REVERSAL || fact.getSettlementStatus() == McnIncomeSettlementStatus.REVERSED || fact.getSettlementStatus() == McnIncomeSettlementStatus.CANCELLED) return new ProjectionDecision("VOIDED", resolvedUserId);
        if (fact.getSettlementStatus() != McnIncomeSettlementStatus.SETTLED) return new ProjectionDecision("AWAITING_FINALITY", resolvedUserId);
        return new ProjectionDecision("BOUND_FINAL", resolvedUserId);
    }
    private String platform(String value) { String v = value == null ? "" : value.trim().toUpperCase(Locale.ROOT); if (!"TIMO".equals(v) && !"LINKY".equals(v)) throw new IllegalArgumentException("income platform must be TIMO or LINKY"); return v; }
    private McnIncomeShadowLedgerSummaryResponse response(String platform, LocalDate day, int source, int latest, Counts c, String runId) { return new McnIncomeShadowLedgerSummaryResponse(platform, day, source, latest, c.boundFinal, c.unmatched, c.awaitingFinality, c.voided, runId); }
    private static class Counts { int boundFinal; int unmatched; int awaitingFinality; int voided; void add(String status) { switch (status) { case "BOUND_FINAL" -> boundFinal++; case "UNMATCHED" -> unmatched++; case "AWAITING_FINALITY" -> awaitingFinality++; case "VOIDED" -> voided++; default -> throw new IllegalStateException("unknown shadow status"); } } }
    private record ProjectionDecision(String status, Long resolvedUserId) { }
    private record ExceptionRow(LocalDate businessDate, String guildId, String shadowStatus, String settlementStatus,
                                String eventType, Instant sourceUpdatedAt) { }
}
