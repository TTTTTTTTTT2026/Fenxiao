package com.fenxiao.rule.service;

import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.rule.api.dto.CommissionPolicyRequest;
import com.fenxiao.rule.api.dto.CommissionPolicyResponse;
import com.fenxiao.rule.entity.CommissionPolicy;
import com.fenxiao.rule.repository.CommissionPolicyRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional
public class CommissionPolicyService {
    private static final String MODULE = "commission_policy";
    private final CommissionPolicyRepository policies;
    private final OperationAuditLogRepository audits;
    private final Clock clock;

    public CommissionPolicyService(CommissionPolicyRepository policies, OperationAuditLogRepository audits, Clock clock) {
        this.policies = policies; this.audits = audits; this.clock = clock;
    }

    public List<CommissionPolicyResponse> list() { return policies.findAllByOrderByEffectiveFromDescIdDesc().stream().map(this::response).toList(); }

    public CommissionPolicyResponse createDraft(CommissionPolicyRequest request, AdminSessionService.AdminPrincipal actor) {
        Levels levels = validate(request);
        CommissionPolicy policy = CommissionPolicy.draft("CP-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT),
                normalizedPlatform(request.platformCode()), normalized(request.countryCode()), request.maxRewardLevel(),
                levels.one.enabled(), levels.one.rate(), levels.one.freezeDays(), levels.two.enabled(), levels.two.rate(), levels.two.freezeDays(),
                levels.three.enabled(), levels.three.rate(), levels.three.freezeDays(), request.effectiveFrom(), request.effectiveTo(), actor.accountId());
        policy = policies.save(policy);
        audit(actor, policy, "CREATE_DRAFT", null, snapshot(policy), "建立待審分成策略");
        return response(policy);
    }

    public CommissionPolicyResponse activate(long id, String approvalNote, AdminSessionService.AdminPrincipal actor) {
        CommissionPolicy policy = policies.findById(id).orElseThrow(() -> new IllegalArgumentException("commission policy not found"));
        if (!CommissionPolicy.DRAFT.equals(policy.getStatus())) throw new IllegalStateException("only draft policy can be activated");
        ensureNoOverlap(policy);
        String before = snapshot(policy);
        policy.activate(actor.accountId(), LocalDateTime.now(clock), approvalNote.trim());
        policy = policies.save(policy);
        audit(actor, policy, "ACTIVATE", before, snapshot(policy), "啟用分成策略；僅影響後續候選演算");
        return response(policy);
    }

    public CommissionPolicyResponse retire(long id, AdminSessionService.AdminPrincipal actor) {
        CommissionPolicy policy = policies.findById(id).orElseThrow(() -> new IllegalArgumentException("commission policy not found"));
        if (!CommissionPolicy.ACTIVE.equals(policy.getStatus())) throw new IllegalStateException("only active policy can be retired");
        String before = snapshot(policy); policy.retire(); policy = policies.save(policy);
        audit(actor, policy, "RETIRE", before, snapshot(policy), "停止使用分成策略；不會更改歷史候選");
        return response(policy);
    }

    /** Returns the one policy applicable at income occurrence time. Empty means policy is deliberately not configured. */
    public Optional<CommissionPolicy> findEffective(String platform, String country, LocalDateTime occurredAt) {
        List<CommissionPolicy> rows = policies.findActiveAt(normalizedPlatform(platform), normalized(country), occurredAt);
        if (rows.size() > 1) throw new IllegalStateException("multiple active commission policies match the income occurrence time");
        return rows.stream().findFirst();
    }

    private Levels validate(CommissionPolicyRequest request) {
        if (request.effectiveTo() != null && request.effectiveTo().isBefore(request.effectiveFrom())) throw new IllegalArgumentException("effectiveTo must not be before effectiveFrom");
        if (request.levels().size() != 3) throw new IllegalArgumentException("all three commission levels must be supplied");
        Map<Integer, CommissionPolicyRequest.LevelRequest> byLevel = new HashMap<>();
        for (CommissionPolicyRequest.LevelRequest level : request.levels()) {
            if (byLevel.put(level.rewardLevel(), level) != null) throw new IllegalArgumentException("commission level is duplicated");
        }
        CommissionPolicyRequest.LevelRequest one = require(byLevel, 1), two = require(byLevel, 2), three = require(byLevel, 3);
        validateLevel(one, request.maxRewardLevel()); validateLevel(two, request.maxRewardLevel()); validateLevel(three, request.maxRewardLevel());
        if (!one.enabled()) throw new IllegalArgumentException("level 1 must be enabled in every active policy");
        return new Levels(toLevel(one), toLevel(two), toLevel(three));
    }
    private CommissionPolicyRequest.LevelRequest require(Map<Integer, CommissionPolicyRequest.LevelRequest> levels, int level) {
        var result = levels.get(level); if (result == null) throw new IllegalArgumentException("commission level " + level + " is required"); return result;
    }
    private void validateLevel(CommissionPolicyRequest.LevelRequest level, int max) {
        if (level.rewardLevel() > max && level.enabled()) throw new IllegalArgumentException("levels above maxRewardLevel must be disabled");
        if (level.enabled() && (level.rewardRate() == null || level.freezeDays() == null)) throw new IllegalArgumentException("enabled commission levels require rate and freeze days");
        if (!level.enabled() && (level.rewardRate() != null || level.freezeDays() != null)) throw new IllegalArgumentException("disabled commission levels must not carry a zero-rate rule");
    }
    private CommissionPolicy.Level toLevel(CommissionPolicyRequest.LevelRequest value) { return new CommissionPolicy.Level(value.enabled(), value.rewardRate(), value.freezeDays()); }
    private void ensureNoOverlap(CommissionPolicy candidate) {
        for (CommissionPolicy other : policies.findByCommissionTypeAndPlatformCodeAndCountryCodeAndStatus(CommissionPolicy.INVITATION, candidate.getPlatformCode(), candidate.getCountryCode(), CommissionPolicy.ACTIVE)) {
            boolean startsBeforeOtherEnds = other.getEffectiveTo() == null || !candidate.getEffectiveFrom().isAfter(other.getEffectiveTo());
            boolean otherStartsBeforeCandidateEnds = candidate.getEffectiveTo() == null || !other.getEffectiveFrom().isAfter(candidate.getEffectiveTo());
            if (!other.getId().equals(candidate.getId()) && startsBeforeOtherEnds && otherStartsBeforeCandidateEnds) {
                throw new IllegalStateException("an active policy already overlaps this scope and effective time range");
            }
        }
    }
    private CommissionPolicyResponse response(CommissionPolicy policy) {
        return new CommissionPolicyResponse(policy.getId(), policy.getPolicyCode(), policy.getCommissionType(), policy.getPlatformCode(), policy.getCountryCode(), policy.getMaxRewardLevel(), policy.getStatus(),
                policy.getEffectiveFrom(), policy.getEffectiveTo(), policy.getCreatedBy(), policy.getApprovedBy(), policy.getApprovedAt(), policy.getApprovalNote(),
                List.of(levelResponse(policy, 1), levelResponse(policy, 2), levelResponse(policy, 3)));
    }
    private CommissionPolicyResponse.LevelResponse levelResponse(CommissionPolicy policy, int level) { var row = policy.level(level); return new CommissionPolicyResponse.LevelResponse(level, row.enabled(), row.rate(), row.freezeDays()); }
    private void audit(AdminSessionService.AdminPrincipal actor, CommissionPolicy policy, String action, String before, String after, String remark) {
        audits.save(OperationAuditLog.create(actor.accountId(), actor.role(), MODULE, "commission_policy", policy.getId(), action, before, after, null, remark, LocalDateTime.now(clock)));
    }
    private String snapshot(CommissionPolicy policy) { return String.format(Locale.ROOT, "code=%s,type=%s,scope=%s/%s,max=%d,status=%s,effective=%s..%s", policy.getPolicyCode(), policy.getCommissionType(), policy.getPlatformCode(), policy.getCountryCode(), policy.getMaxRewardLevel(), policy.getStatus(), policy.getEffectiveFrom(), policy.getEffectiveTo()); }
    private String normalized(String value) { return value.trim().toUpperCase(Locale.ROOT); }
    private String normalizedPlatform(String value) { String result = normalized(value); if (!"TIMO".equals(result) && !"LINKY".equals(result)) throw new IllegalArgumentException("commission platform must be TIMO or LINKY"); return result; }
    private record Levels(CommissionPolicy.Level one, CommissionPolicy.Level two, CommissionPolicy.Level three) { }
}
