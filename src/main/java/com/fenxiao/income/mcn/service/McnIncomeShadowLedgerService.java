package com.fenxiao.income.mcn.service;

import com.fenxiao.income.mcn.api.dto.McnIncomeShadowLedgerSummaryResponse;
import com.fenxiao.income.mcn.api.dto.McnIncomeDataQualityExceptionResponse;
import com.fenxiao.income.mcn.api.dto.McnIncomeDataQualityResponse;
import com.fenxiao.income.mcn.domain.McnIncomeEventType;
import com.fenxiao.income.mcn.domain.McnIncomeSettlementStatus;
import com.fenxiao.income.mcn.entity.McnIncomeRawLedgerEvent;
import com.fenxiao.income.mcn.repository.McnIncomeRawLedgerEventRepository;
import com.fenxiao.platform.domain.PlatformBindingStatus;
import com.fenxiao.platform.repository.PlatformAccountBindingRepository;
import jakarta.transaction.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.HashMap;
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
    private final McnIncomeRawLedgerEventRepository rawEvents;
    private final PlatformAccountBindingRepository bindings;
    private final JdbcTemplate jdbc;
    private final Clock clock;

    public McnIncomeShadowLedgerService(McnIncomeRawLedgerEventRepository rawEvents, PlatformAccountBindingRepository bindings, JdbcTemplate jdbc, Clock clock) {
        this.rawEvents = rawEvents; this.bindings = bindings; this.jdbc = jdbc; this.clock = clock;
    }

    public McnIncomeShadowLedgerSummaryResponse refresh(String platformCode, LocalDate businessDate) {
        String platform = platform(platformCode);
        List<McnIncomeRawLedgerEvent> facts = rawEvents.findBySourceSystemAndPlatformCodeAndBusinessDateBetween("MCN", platform, businessDate, businessDate);
        Map<String, McnIncomeRawLedgerEvent> latest = new HashMap<>();
        for (McnIncomeRawLedgerEvent fact : facts) latest.merge(fact.getSourceEventId(), fact, this::newer);
        Counts counts = new Counts();
        Instant now = clock.instant();
        for (McnIncomeRawLedgerEvent fact : latest.values()) {
            ProjectionDecision decision = decision(platform, fact); counts.add(decision.status());
            jdbc.update("""
                    INSERT INTO mcn_income_shadow_ledger_projection
                    (source_system, platform_code, source_event_id, raw_ledger_event_id, source_revision, business_date, guild_id, resolved_user_id, settlement_status, event_type, amount, amount_unit, currency_code, shadow_status, source_updated_at, projected_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE raw_ledger_event_id=VALUES(raw_ledger_event_id), source_revision=VALUES(source_revision), business_date=VALUES(business_date), guild_id=VALUES(guild_id), resolved_user_id=VALUES(resolved_user_id), settlement_status=VALUES(settlement_status), event_type=VALUES(event_type), amount=VALUES(amount), amount_unit=VALUES(amount_unit), currency_code=VALUES(currency_code), shadow_status=VALUES(shadow_status), source_updated_at=VALUES(source_updated_at), projected_at=VALUES(projected_at)
                    """, fact.getSourceSystem(), platform, fact.getSourceEventId(), fact.getId(), fact.getSourceRevision(), businessDate,
                    fact.getGuildId(), decision.resolvedUserId(), fact.getSettlementStatus().name(), fact.getEventType().name(), fact.getAmount(),
                    fact.getAmountUnit(), fact.getCurrencyCode(), decision.status(), Timestamp.from(fact.getSourceUpdatedAt()), Timestamp.from(now));
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
                """, (rs, row) -> new McnIncomeDataQualityExceptionResponse(
                rs.getString(1), rs.getObject(2, LocalDate.class), rs.getString(3), rs.getString(4), rs.getString(5),
                rs.getString(6), rs.getString(7), rs.getTimestamp(8).toInstant()), platform, businessDate, safeLimit);
    }

    private int count(String sql, String platform, LocalDate businessDate) {
        Integer result = jdbc.queryForObject(sql, Integer.class, platform, businessDate);
        return result == null ? 0 : result;
    }

    private McnIncomeRawLedgerEvent newer(McnIncomeRawLedgerEvent left, McnIncomeRawLedgerEvent right) {
        Comparator<McnIncomeRawLedgerEvent> order = Comparator.comparing(McnIncomeRawLedgerEvent::getSourceUpdatedAt).thenComparing(McnIncomeRawLedgerEvent::getSourceRevision);
        return order.compare(left, right) >= 0 ? left : right;
    }
    private ProjectionDecision decision(String platform, McnIncomeRawLedgerEvent fact) {
        Long resolvedUserId = bindings.findByPlatformCodeAndPlatformUserId(platform, fact.getPlatformUserId())
                .filter(binding -> binding.getBindingStatus() == PlatformBindingStatus.VERIFIED)
                .map(binding -> binding.getUserId()).orElse(null);
        if (resolvedUserId == null) return new ProjectionDecision("UNMATCHED", null);
        if (fact.getEventType() == McnIncomeEventType.REVERSAL || fact.getSettlementStatus() == McnIncomeSettlementStatus.REVERSED || fact.getSettlementStatus() == McnIncomeSettlementStatus.CANCELLED) return new ProjectionDecision("VOIDED", resolvedUserId);
        if (fact.getSettlementStatus() != McnIncomeSettlementStatus.SETTLED) return new ProjectionDecision("AWAITING_FINALITY", resolvedUserId);
        return new ProjectionDecision("BOUND_FINAL", resolvedUserId);
    }
    private String platform(String value) { String v = value == null ? "" : value.trim().toUpperCase(Locale.ROOT); if (!"TIMO".equals(v) && !"LINKY".equals(v)) throw new IllegalArgumentException("income platform must be TIMO or LINKY"); return v; }
    private McnIncomeShadowLedgerSummaryResponse response(String platform, LocalDate day, int source, int latest, Counts c, String runId) { return new McnIncomeShadowLedgerSummaryResponse(platform, day, source, latest, c.boundFinal, c.unmatched, c.awaitingFinality, c.voided, runId); }
    private static class Counts { int boundFinal; int unmatched; int awaitingFinality; int voided; void add(String status) { switch (status) { case "BOUND_FINAL" -> boundFinal++; case "UNMATCHED" -> unmatched++; case "AWAITING_FINALITY" -> awaitingFinality++; case "VOIDED" -> voided++; default -> throw new IllegalStateException("unknown shadow status"); } } }
    private record ProjectionDecision(String status, Long resolvedUserId) { }
}
