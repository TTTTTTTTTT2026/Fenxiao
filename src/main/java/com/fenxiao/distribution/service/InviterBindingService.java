package com.fenxiao.distribution.service;

import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.common.api.ForbiddenException;
import com.fenxiao.distribution.api.dto.AssistedBindingRequest;
import com.fenxiao.distribution.api.dto.RegisterLinkyAccountRequest;
import com.fenxiao.distribution.api.dto.InvitationProgressResponse;
import com.fenxiao.distribution.domain.BindSource;
import com.fenxiao.distribution.repository.DistributionRelationRepository;
import com.fenxiao.distribution.repository.LinkyAccountBindingRepository;
import com.fenxiao.distribution.repository.LinkyVerificationAttemptRepository;
import com.fenxiao.platform.service.PlatformLifecycleService;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;

@Service
public class InviterBindingService {
    private final com.fenxiao.distribution.service.RegistrationClaimGuard claimGuard;
    private final UserDistributionProfileRepository users;
    private final DistributionRelationRepository relations;
    private final InvitationProgressService progress;
    private final PlatformLifecycleService timo;
    private final InviteBindingRegistrationService linky;
    private final LinkyAccountBindingRepository linkyBindings;
    private final LinkyVerificationAttemptRepository linkyAttempts;
    private final OperationAuditLogRepository audits;
    private final Clock clock;

    public InviterBindingService(UserDistributionProfileRepository users, DistributionRelationRepository relations,
                                InvitationProgressService progress, PlatformLifecycleService timo,
                                InviteBindingRegistrationService linky, LinkyAccountBindingRepository linkyBindings,
                                LinkyVerificationAttemptRepository linkyAttempts, OperationAuditLogRepository audits,
                                Clock clock, com.fenxiao.distribution.service.RegistrationClaimGuard claimGuard) {
        this.claimGuard = claimGuard;
        this.users = users; this.relations = relations; this.progress = progress; this.timo = timo;
        this.linky = linky; this.linkyBindings = linkyBindings; this.linkyAttempts = linkyAttempts;
        this.audits = audits; this.clock = clock;
    }

    @Transactional
    public Long submit(Long inviterId, Long inviteeId, AssistedBindingRequest request, String requestIp) {
        String platform = request.platformCode();
        String account = request.platformUserId();
        String pattern = "TIMO".equals(platform) ? "[1-9][0-9]{11}" : "[0-9]{8}";
        if (!("TIMO".equals(platform) || "LINKY".equals(platform)) || account == null || !account.matches(pattern))
            throw new IllegalArgumentException("invalid assisted binding account");
        claimGuard.lock(platform + ":" + account);
        if (inviterId.equals(inviteeId)) throw new ForbiddenException("direct invitee required");
        // Serialize against the invitee's own submission, reset, and another assisted submission.
        for (long id : new long[]{Math.min(inviterId, inviteeId), Math.max(inviterId, inviteeId)}) {
            var user = users.findByIdForBinding(id).orElseThrow(() -> new ForbiddenException("direct invitee required"));
            if (user.getAccountStatus() != com.fenxiao.identity.domain.AccountStatus.ACTIVE)
                throw new ForbiddenException("account is not active");
        }
        var relation = relations.findByUserIdForBinding(inviteeId)
                .orElseThrow(() -> new ForbiddenException("direct invitee required"));
        if (!inviterId.equals(relation.getLevel1InviterId()) || relation.getBindSource() != BindSource.INVITE_CODE)
            throw new ForbiddenException("direct invitee required");
        if (!progress.verified(inviterId, platform))
            throw new ForbiddenException("inviter must verify this app first");
        if (!"UNBOUND".equals(progress.getItem(inviteeId, platform).bindingStatus()))
            throw new IllegalStateException("invitee already submitted this app");
        if ("LINKY".equals(platform) && (linkyAttempts.existsByUserId(inviteeId)
                || !linkyBindings.findByUserIdIn(java.util.List.of(inviteeId)).isEmpty()))
            throw new IllegalStateException("invitee already submitted this app");

        auditSubmission(inviterId, inviteeId, request, requestIp);
        if ("TIMO".equals(platform)) return timo.submit(inviteeId, platform, account).getId();
        try {
            linky.registerForUser(inviteeId, new RegisterLinkyAccountRequest("LINKY", account));
        } catch (IllegalStateException exception) {
            throw new LinkySubmissionFailed(exception);
        }
        return null;
    }

    public static class LinkySubmissionFailed extends RuntimeException {
        public LinkySubmissionFailed(IllegalStateException cause) { super(cause.getMessage(), cause); }
    }

    @Transactional
    public void recordFailedLinkySubmission(Long inviterId, Long inviteeId, AssistedBindingRequest request, String requestIp) {
        // The original submission transaction has already rolled back before this entry point.
        auditSubmission(inviterId, inviteeId, request, requestIp);
    }

    private void auditSubmission(Long inviterId, Long inviteeId, AssistedBindingRequest request, String requestIp) {
        audits.save(OperationAuditLog.create(inviterId, "INVITER", "INVITER_BINDING", "DISTRIBUTION_USER", inviteeId,
                "SUBMIT_" + request.platformCode(), "UNBOUND", "account=" + InvitationProgressService.maskAccount(request.platformUserId()),
                requestIp, "Inviter requested binding verification for a direct invitee", LocalDateTime.now(clock)));
    }

    @Transactional(readOnly = true)
    public InvitationProgressResponse.Item result(Long inviterId, Long inviteeId, String platform) {
        var relation = relations.findByUserId(inviteeId).orElseThrow(() -> new ForbiddenException("direct invitee required"));
        if (!inviterId.equals(relation.getLevel1InviterId()) || relation.getBindSource() != BindSource.INVITE_CODE)
            throw new ForbiddenException("direct invitee required");
        return progress.getItem(inviteeId, platform);
    }
}
