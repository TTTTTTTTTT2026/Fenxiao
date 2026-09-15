package com.fenxiao.income.mcn.service;

import com.fenxiao.identity.domain.AccountStatus;
import com.fenxiao.income.mcn.api.dto.McnIncomeRewardCandidateItemResponse;
import com.fenxiao.income.mcn.api.dto.McnIncomeRewardCandidateSampleResponse;
import com.fenxiao.income.mcn.api.dto.McnIncomeRewardCandidateSummaryResponse;
import com.fenxiao.platform.domain.PlatformBindingStatus;
import com.fenxiao.platform.repository.PlatformAccountBindingRepository;
import com.fenxiao.relationship.entity.InvitationRelationVersion;
import com.fenxiao.relationship.repository.InvitationRelationVersionRepository;
import com.fenxiao.rule.entity.CommissionPolicy;
import com.fenxiao.rule.service.CommissionPolicyService;
import com.fenxiao.user.entity.UserDistributionProfile;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import jakarta.transaction.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

/**
 * A read-only business preview. It intentionally has no dependency on the reward engine,
 * reward records, wallet, withdrawal, or payment services.
 */
@Service
@Transactional
public class McnIncomeRewardCandidateService {
    private static final String SOURCE_SYSTEM = "MCN";
    private final JdbcTemplate jdbc;
    private final PlatformAccountBindingRepository bindingRepository;
    private final InvitationRelationVersionRepository invitationRepository;
    private final CommissionPolicyService commissionPolicies;
    private final UserDistributionProfileRepository userRepository;
    private final Clock clock;

    public McnIncomeRewardCandidateService(JdbcTemplate jdbc,
                                           PlatformAccountBindingRepository bindingRepository,
                                           InvitationRelationVersionRepository invitationRepository,
                                           CommissionPolicyService commissionPolicies,
                                           UserDistributionProfileRepository userRepository,
                                           Clock clock) {
        this.jdbc = jdbc; this.bindingRepository = bindingRepository; this.invitationRepository = invitationRepository;
        this.commissionPolicies = commissionPolicies; this.userRepository = userRepository; this.clock = clock;
    }

    public McnIncomeRewardCandidateSummaryResponse refresh(String platformCode, LocalDate businessDate) {
        String platform = platform(platformCode);
        List<CandidateInput> inputs = jdbc.query("""
                SELECT p.source_event_id,p.raw_ledger_event_id,p.source_revision,p.business_date,p.resolved_user_id,p.shadow_status,
                       r.occurred_at,r.amount,r.currency_code,r.amount_unit
                FROM mcn_income_shadow_ledger_projection p
                JOIN mcn_income_raw_ledger_event r ON r.id=p.raw_ledger_event_id
                WHERE p.source_system=? AND p.platform_code=? AND p.business_date=?
                ORDER BY p.source_event_id
                """, (rs, row) -> new CandidateInput(rs.getString(1), rs.getLong(2), rs.getString(3),
                rs.getObject(4, LocalDate.class), rs.getObject(5, Long.class), rs.getString(6),
                rs.getTimestamp(7).toInstant(), rs.getBigDecimal(8), rs.getString(9), rs.getString(10)), SOURCE_SYSTEM, platform, businessDate);
        Counts counts = new Counts();
        Instant now = clock.instant();
        // A corrected MCN revision can move an event out of this business date. Rebuild the current
        // view from the shadow-ledger inputs so no superseded candidate survives the next run.
        jdbc.update("DELETE FROM mcn_income_reward_candidate_projection WHERE source_system=? AND platform_code=? AND business_date=?", SOURCE_SYSTEM, platform, businessDate);
        for (CandidateInput input : inputs) project(platform, input, now, counts);
        String runId = UUID.randomUUID().toString();
        jdbc.update("INSERT INTO mcn_income_reward_candidate_run (run_id,platform_code,business_date,source_fact_count,source_ready_count,candidate_count,blocked_count,candidate_amount,amount_unit,started_at,completed_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                runId, platform, businessDate, inputs.size(), counts.sourceReady, counts.candidates, counts.blocked,
                counts.amount, counts.amountUnit, Timestamp.from(now), Timestamp.from(now));
        snapshotRun(runId, platform, businessDate);
        return response(platform, businessDate, inputs.size(), counts, runId);
    }

    @Transactional
    public McnIncomeRewardCandidateSummaryResponse summary(String platformCode, LocalDate businessDate) {
        String platform = platform(platformCode);
        List<McnIncomeRewardCandidateSummaryResponse> rows = jdbc.query("""
                SELECT source_fact_count,source_ready_count,candidate_count,blocked_count,candidate_amount,amount_unit,run_id
                FROM mcn_income_reward_candidate_run WHERE platform_code=? AND business_date=? ORDER BY id DESC LIMIT 1
                """, (rs, row) -> new McnIncomeRewardCandidateSummaryResponse(platform, businessDate, rs.getInt(1), rs.getInt(2),
                rs.getInt(3), rs.getInt(4), rs.getBigDecimal(5), rs.getString(6), rs.getString(7)), platform, businessDate);
        return rows.isEmpty() ? new McnIncomeRewardCandidateSummaryResponse(platform, businessDate, 0, 0, 0, 0, BigDecimal.ZERO, null, null) : rows.getFirst();
    }

    @Transactional
    public List<McnIncomeRewardCandidateItemResponse> items(String platformCode, LocalDate businessDate, int limit) {
        String platform = platform(platformCode); int safeLimit = Math.max(1, Math.min(limit, 100));
        return jdbc.query("""
                SELECT source_event_id,business_date,source_user_id,recipient_user_id,reward_level,candidate_status,decision_reason,base_amount,candidate_amount,amount_unit,
                       invitation_version_no,commission_policy_code,rule_rate
                FROM mcn_income_reward_candidate_projection
                WHERE source_system=? AND platform_code=? AND business_date=? AND reward_level > 0
                ORDER BY CASE candidate_status WHEN 'CANDIDATE' THEN 1 ELSE 0 END, source_event_id, reward_level
                LIMIT ?
                """, (rs, row) -> new McnIncomeRewardCandidateItemResponse(rs.getString(1), rs.getObject(2, LocalDate.class),
                rs.getObject(3, Long.class), rs.getObject(4, Long.class), rs.getInt(5), rs.getString(6), rs.getString(7),
                rs.getBigDecimal(8), rs.getBigDecimal(9), rs.getString(10), rs.getObject(11, Integer.class), rs.getString(12), rs.getBigDecimal(13)), SOURCE_SYSTEM, platform, businessDate, safeLimit);
    }

    private void project(String platform, CandidateInput input, Instant now, Counts counts) {
        jdbc.update("DELETE FROM mcn_income_reward_candidate_projection WHERE source_system=? AND platform_code=? AND source_event_id=?", SOURCE_SYSTEM, platform, input.sourceEventId());
        if (!"BOUND_FINAL".equals(input.shadowStatus())) {
            writeBase(platform, input, null, "BLOCKED_" + input.shadowStatus(), "income fact is not a bound final fact", now);
            counts.blocked++; return;
        }
        if (input.sourceUserId() == null) {
            writeBase(platform, input, null, "BLOCKED_UNMATCHED", "no resolved BANDEIRA user", now);
            counts.blocked++; return;
        }
        UserDistributionProfile source = userRepository.findById(input.sourceUserId()).orElse(null);
        if (source == null || source.getAccountStatus() != AccountStatus.ACTIVE) {
            writeBase(platform, input, input.sourceUserId(), "BLOCKED_SOURCE_INACTIVE", "source user is not currently active", now);
            counts.blocked++; return;
        }
        LocalDateTime occurredAt = LocalDateTime.ofInstant(input.occurredAt(), ZoneOffset.UTC);
        boolean bindingEffective = bindingRepository.findByUserIdAndPlatformCode(input.sourceUserId(), platform)
                .filter(value -> value.getBindingStatus() == PlatformBindingStatus.VERIFIED)
                .map(value -> value.getVerifiedAt() != null && !value.getVerifiedAt().isAfter(occurredAt)).orElse(false);
        if (!bindingEffective) {
            writeBase(platform, input, input.sourceUserId(), "BLOCKED_BINDING_NOT_EFFECTIVE", "binding was not verified at the income occurrence time", now);
            counts.blocked++; return;
        }
        writeBase(platform, input, input.sourceUserId(), "SOURCE_READY", "bound final fact with time-effective binding", now);
        counts.sourceReady++;
        Optional<CommissionPolicy> policy = commissionPolicies.findEffective(platform, source.getCountryCode(), occurredAt);
        if (policy.isEmpty()) {
            writeCandidate(platform, input, input.sourceUserId(), null, 1, null, null, null, null,
                    "BLOCKED_NO_POLICY", "no active commission policy at income occurrence time", now);
            counts.blocked++;
            return;
        }
        Long currentUserId = input.sourceUserId();
        for (int level = 1; level <= 3; level++) {
            if (level > policy.get().getMaxRewardLevel() || !policy.get().level(level).enabled()) break;
            Optional<InvitationRelationVersion> relation = invitationRepository.findEffectiveAt(currentUserId, occurredAt);
            if (relation.isEmpty() || relation.get().getInviterUserId() == null) {
                if (level == 1) {
                    writeCandidate(platform, input, input.sourceUserId(), null, level, relation.map(InvitationRelationVersion::getVersionNo).orElse(null), policy.get().getId(), policy.get().getPolicyCode(), null,
                            "BLOCKED_NO_INVITER", "no effective direct inviter at income occurrence time", now);
                    counts.blocked++;
                }
                break;
            }
            InvitationRelationVersion snapshot = relation.get();
            Long recipientId = snapshot.getInviterUserId();
            UserDistributionProfile recipient = userRepository.findById(recipientId).orElse(null);
            if (recipient == null || recipient.getAccountStatus() != AccountStatus.ACTIVE) {
                writeCandidate(platform, input, input.sourceUserId(), recipientId, level, snapshot.getVersionNo(), policy.get().getId(), policy.get().getPolicyCode(), null,
                        "BLOCKED_RECIPIENT_INACTIVE", "recipient is not currently active", now);
                counts.blocked++; currentUserId = recipientId; continue;
            }
            BigDecimal rate = policy.get().level(level).rate();
            BigDecimal amount = input.amount().multiply(rate).setScale(6, RoundingMode.HALF_UP);
            writeCandidate(platform, input, input.sourceUserId(), recipientId, level, snapshot.getVersionNo(), policy.get().getId(), policy.get().getPolicyCode(), rate,
                    "CANDIDATE", "commission policy and invitation snapshot matched", now);
            counts.candidates++; counts.amount = counts.amount.add(amount); counts.amountUnit = input.amountUnit();
            updateCandidateAmount(platform, input.sourceEventId(), level, amount);
            currentUserId = recipientId;
        }
    }

    private void writeBase(String platform, CandidateInput input, Long sourceUserId, String status, String reason, Instant now) {
        writeCandidate(platform, input, sourceUserId, null, 0, null, null, null, null, status, reason, now);
    }

    private void writeCandidate(String platform, CandidateInput input, Long sourceUserId, Long recipientUserId, int level, Integer invitationVersion,
                                Long policyId, String policyCode, BigDecimal ruleRate, String status, String reason, Instant now) {
        jdbc.update("""
                INSERT INTO mcn_income_reward_candidate_projection
                (source_system,platform_code,source_event_id,raw_ledger_event_id,source_revision,business_date,occurred_at,source_user_id,recipient_user_id,reward_level,invitation_version_no,rule_id,commission_policy_id,commission_policy_code,rule_rate,base_amount,candidate_amount,currency_code,amount_unit,candidate_status,decision_reason,projected_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                """, SOURCE_SYSTEM, platform, input.sourceEventId(), input.rawLedgerEventId(), input.sourceRevision(), input.businessDate(), Timestamp.from(input.occurredAt()),
                sourceUserId, recipientUserId, level, invitationVersion, null, policyId, policyCode, ruleRate, input.amount(), null, input.currencyCode(), input.amountUnit(), status, reason, Timestamp.from(now));
    }

    private void updateCandidateAmount(String platform, String sourceEventId, int level, BigDecimal amount) {
        jdbc.update("UPDATE mcn_income_reward_candidate_projection SET candidate_amount=? WHERE source_system=? AND platform_code=? AND source_event_id=? AND reward_level=?",
                amount, SOURCE_SYSTEM, platform, sourceEventId, level);
    }

    /** Returns a deterministic, balanced audit sample from an immutable candidate-run snapshot. */
    @Transactional
    public McnIncomeRewardCandidateSampleResponse sample(String runId, int limit) {
        String normalizedRunId = requiredRunId(runId);
        int requested = Math.max(1, Math.min(limit, 50));
        RunScope scope = runScope(normalizedRunId);
        int candidateAvailable = countRunItems(normalizedRunId, "candidate_status='CANDIDATE'");
        int blockedAvailable = countRunItems(normalizedRunId, "candidate_status<>'SOURCE_READY' AND candidate_status<>'CANDIDATE'");
        int available = candidateAvailable + blockedAvailable;
        int candidateLimit = sampleQuota(requested, candidateAvailable, blockedAvailable);
        int blockedLimit = Math.min(blockedAvailable, requested - candidateLimit);
        candidateLimit = Math.min(candidateAvailable, requested - blockedLimit);
        List<McnIncomeRewardCandidateItemResponse> items = new java.util.ArrayList<>(candidateItems(normalizedRunId, "candidate_status='CANDIDATE'", candidateLimit));
        items.addAll(candidateItems(normalizedRunId, "candidate_status<>'SOURCE_READY' AND candidate_status<>'CANDIDATE'", blockedLimit));
        return new McnIncomeRewardCandidateSampleResponse(normalizedRunId, scope.platformCode(), scope.businessDate(), requested,
                available, candidateAvailable, blockedAvailable, List.copyOf(items));
    }

    private void snapshotRun(String runId, String platform, LocalDate businessDate) {
        jdbc.update("""
                INSERT INTO mcn_income_reward_candidate_run_item
                (run_id,source_system,platform_code,source_event_id,raw_ledger_event_id,source_revision,business_date,occurred_at,source_user_id,recipient_user_id,reward_level,invitation_version_no,commission_policy_id,commission_policy_code,rule_rate,base_amount,candidate_amount,currency_code,amount_unit,candidate_status,decision_reason,projected_at)
                SELECT ?,source_system,platform_code,source_event_id,raw_ledger_event_id,source_revision,business_date,occurred_at,source_user_id,recipient_user_id,reward_level,invitation_version_no,commission_policy_id,commission_policy_code,rule_rate,base_amount,candidate_amount,currency_code,amount_unit,candidate_status,decision_reason,projected_at
                FROM mcn_income_reward_candidate_projection
                WHERE source_system=? AND platform_code=? AND business_date=?
                """, runId, SOURCE_SYSTEM, platform, businessDate);
    }

    private RunScope runScope(String runId) {
        List<RunScope> rows = jdbc.query("SELECT platform_code,business_date FROM mcn_income_reward_candidate_run WHERE run_id=?",
                (rs, row) -> new RunScope(rs.getString(1), rs.getObject(2, LocalDate.class)), runId);
        if (rows.isEmpty()) throw new IllegalArgumentException("candidate run not found");
        return rows.getFirst();
    }

    private int countRunItems(String runId, String statusPredicate) {
        Integer value = jdbc.queryForObject("SELECT COUNT(*) FROM mcn_income_reward_candidate_run_item WHERE run_id=? AND " + statusPredicate,
                Integer.class, runId);
        return value == null ? 0 : value;
    }

    private List<McnIncomeRewardCandidateItemResponse> candidateItems(String runId, String statusPredicate, int limit) {
        if (limit <= 0) return List.of();
        return jdbc.query("""
                SELECT source_event_id,business_date,source_user_id,recipient_user_id,reward_level,candidate_status,decision_reason,base_amount,candidate_amount,amount_unit,
                       invitation_version_no,commission_policy_code,rule_rate
                FROM mcn_income_reward_candidate_run_item
                WHERE run_id=? AND %s
                ORDER BY SHA2(CONCAT(source_event_id, ':', reward_level), 256), source_event_id, reward_level
                LIMIT ?
                """.formatted(statusPredicate), (rs, row) -> new McnIncomeRewardCandidateItemResponse(rs.getString(1), rs.getObject(2, LocalDate.class),
                rs.getObject(3, Long.class), rs.getObject(4, Long.class), rs.getInt(5), rs.getString(6), rs.getString(7),
                rs.getBigDecimal(8), rs.getBigDecimal(9), rs.getString(10), rs.getObject(11, Integer.class), rs.getString(12), rs.getBigDecimal(13)), runId, limit);
    }

    static int sampleQuota(int requested, int candidateAvailable, int blockedAvailable) {
        if (candidateAvailable == 0) return 0;
        if (blockedAvailable == 0) return Math.min(candidateAvailable, requested);
        if (requested == 1) return 1;
        return Math.min(candidateAvailable, Math.max(1, requested / 2));
    }

    private String requiredRunId(String runId) {
        if (runId == null || runId.isBlank() || runId.length() > 64) throw new IllegalArgumentException("candidate run id is invalid");
        return runId.trim();
    }

    private McnIncomeRewardCandidateSummaryResponse response(String platform, LocalDate date, int source, Counts counts, String runId) {
        return new McnIncomeRewardCandidateSummaryResponse(platform, date, source, counts.sourceReady, counts.candidates, counts.blocked, counts.amount, counts.amountUnit, runId);
    }
    private String platform(String value) { String v = value == null ? "" : value.trim().toUpperCase(Locale.ROOT); if (!"TIMO".equals(v) && !"LINKY".equals(v)) throw new IllegalArgumentException("income platform must be TIMO or LINKY"); return v; }
    static record CandidateInput(String sourceEventId, long rawLedgerEventId, String sourceRevision, LocalDate businessDate, Long sourceUserId,
                                 String shadowStatus, Instant occurredAt, BigDecimal amount, String currencyCode, String amountUnit) { }
    private static class Counts { int sourceReady; int candidates; int blocked; BigDecimal amount = BigDecimal.ZERO.setScale(6); String amountUnit; }
    private record RunScope(String platformCode, LocalDate businessDate) { }
}
