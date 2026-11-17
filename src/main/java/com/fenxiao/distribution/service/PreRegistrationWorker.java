package com.fenxiao.distribution.service;

import com.fenxiao.distribution.api.dto.RegisterLinkyAccountRequest;
import com.fenxiao.distribution.repository.SubordinatePreRegistrationRepository;
import com.fenxiao.identity.domain.AccountStatus;
import com.fenxiao.income.mcn.service.VerificationCampaignService;
import com.fenxiao.platform.domain.*;
import com.fenxiao.platform.dto.VerifyPlatformBindingRequest;
import com.fenxiao.platform.entity.PlatformVerificationAttempt;
import com.fenxiao.platform.repository.PlatformVerificationAttemptRepository;
import com.fenxiao.platform.service.*;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;

@Service
@Transactional
public class PreRegistrationWorker {
    @jakarta.persistence.PersistenceContext private jakarta.persistence.EntityManager entityManager;
    private final SubordinatePreRegistrationRepository applications;
    private final UserDistributionProfileRepository users;
    private final DistributionBindingService registration;
    private final PlatformBindingVerificationService verification;
    private final PlatformLifecycleService timo;
    private final InviteBindingRegistrationService linky;
    private final InvitationProgressService progress;
    private final RegistrationClaimGuard guard;
    private final PlatformVerificationAttemptRepository attempts;
    private final VerificationCampaignService campaigns;
    private final JdbcTemplate jdbc;
    private final Clock clock;
    public PreRegistrationWorker(SubordinatePreRegistrationRepository applications, UserDistributionProfileRepository users,
            DistributionBindingService registration, PlatformBindingVerificationService verification, PlatformLifecycleService timo,
            InviteBindingRegistrationService linky, InvitationProgressService progress, RegistrationClaimGuard guard,
            PlatformVerificationAttemptRepository attempts, VerificationCampaignService campaigns, JdbcTemplate jdbc, Clock clock) {
        this.applications=applications;this.users=users;this.registration=registration;this.verification=verification;
        this.timo=timo;this.linky=linky;this.progress=progress;this.guard=guard;this.attempts=attempts;
        this.campaigns=campaigns;this.jdbc=jdbc;this.clock=clock;
    }
    public static class Deferred extends RuntimeException {
        final String code;
        Deferred(String code) { super(code); this.code=code; }
    }
    public void verify(Long id,long revision) {
        var snapshot=applications.findById(id).orElseThrow();
        if(!snapshot.pending()) return;
        guard.lock(snapshot.getPlatformCode()+":"+snapshot.getPlatformUserId());
        var user=users.findByIdForBinding(snapshot.getUserId()).orElseThrow();
        var app=applications.lockById(id).orElseThrow();
        entityManager.refresh(app);
        if(!app.pending() || app.getRevision()!=revision) return;
        if(!LocalDateTime.now(clock).isBefore(app.getExpiresAt())) { expire(app,user);return; }
        if(user.getAccountStatus()!=AccountStatus.PRE_REGISTERED && user.getAccountStatus()!=AccountStatus.ACTIVE)
            throw new Deferred("ACCOUNT_INACTIVE");
        if(progress.verified(user.getUserId(),app.getPlatformCode())) {
            String bound="TIMO".equals(app.getPlatformCode())?timo.getBinding(user.getUserId(),"TIMO").getPlatformUserId()
                    :jdbc.queryForObject("SELECT linky_account FROM linky_account_binding WHERE user_id=? ORDER BY id DESC LIMIT 1",String.class,user.getUserId());
            if(!app.getPlatformUserId().equals(bound)) { app.finish("FAILED","ACCOUNT_CHANGED",LocalDateTime.now(clock));return; }
            registration.completePreRegistration(user,false);
            app.finish("COMPLETED","VERIFIED",LocalDateTime.now(clock));record(id,"VERIFIED");return;
        }
        // A claimed owner may use their existing binding flow; never overwrite that submission.
        boolean hasBinding=jdbc.queryForObject("TIMO".equals(app.getPlatformCode())
                ?"SELECT COUNT(*) FROM platform_account_binding WHERE user_id=? AND platform_code='TIMO'"
                :"SELECT COUNT(*) FROM linky_account_binding WHERE user_id=?",Integer.class,user.getUserId())>0;
        if(hasBinding) { app.finish("FAILED","ACCOUNT_CHANGED",LocalDateTime.now(clock));return; }
        guard.assertAccountAvailable(user.getUserId(),app.getPlatformCode(),app.getPlatformUserId());
        if("TIMO".equals(app.getPlatformCode())) {
            var check=verification.verifyBeforeSubmission(user.getUserId(),"TIMO",app.getPlatformUserId(),app.getSubmittedAt());
            var result=check.result();
            if(result.outcome()!=PlatformVerificationOutcome.FOUND)
                throw new Deferred(result.outcome()==PlatformVerificationOutcome.NOT_FOUND?"NOT_IN_GUILD":"SOURCE_UNAVAILABLE");
            if(result.globallySeenBeforeSubmission() && !"MCN_TIMO".equals(result.sourceSystem())) throw new Deferred("NOT_ELIGIBLE");
            var binding=timo.submit(user.getUserId(),"TIMO",app.getPlatformUserId());
            attempts.save(PlatformVerificationAttempt.record(binding,check.expectedGuildId(),check.expectedCountry(),result,LocalDateTime.now(clock)));
            // Establish the real relationship before the existing lifecycle/campaign evaluation.
            registration.completePreRegistration(user,false);
            var verified=timo.verify(new VerifyPlatformBindingRequest("TIMO",app.getPlatformUserId(),result.globallySeenBeforeSubmission(),
                    true,result.officialGuildId(),result.officialJoinedAt(),result.sourceSystem(),result.sourceReference(),binding.getId()));
            if(verified.getBindingStatus()!=PlatformBindingStatus.VERIFIED) throw new Deferred("NOT_ELIGIBLE");
            if("MCN_TIMO".equals(result.sourceSystem())) campaigns.capture(user.getUserId(),"TIMO");
        } else {
            // All provisional relationship/ownership changes roll back if the original Linky flow rejects.
            registration.completePreRegistration(user,false);
            linky.registerForUser(user.getUserId(),new RegisterLinkyAccountRequest("LINKY",app.getPlatformUserId()));
        }
        if(!LocalDateTime.now(clock).isBefore(app.getExpiresAt())) throw new Deferred("DEADLINE_EXCEEDED");
        app.finish("COMPLETED","VERIFIED",LocalDateTime.now(clock));record(id,"VERIFIED");
    }
    // Called after verify's transaction rolls back. Revision protects a concurrent edit/withdrawal.
    public void deferred(Long id,long revision,String code) {
        var snapshot=applications.findById(id).orElseThrow();
        var user=users.findByIdForBinding(snapshot.getUserId()).orElseThrow();
        var app=applications.lockById(id).orElseThrow();
        entityManager.refresh(app);
        if(!app.pending() || app.getRevision()!=revision) return;
        if(!LocalDateTime.now(clock).isBefore(app.getExpiresAt())) { expire(app,user);return; }
        if("LINKY".equals(app.getPlatformCode())) {
            var reasons=jdbc.queryForList("SELECT result_status FROM linky_verification_attempt WHERE user_id=? ORDER BY id DESC LIMIT 1",String.class,user.getUserId());
            if(!reasons.isEmpty()) code=switch(reasons.getFirst()) {
                case "REJECTED","NOT_FOUND"->"NOT_IN_GUILD"; default->"SOURCE_UNAVAILABLE";
            };
        }
        app.waiting(code,LocalDateTime.now(clock));record(id,code);
    }
    private void expire(com.fenxiao.distribution.entity.SubordinatePreRegistration app,com.fenxiao.user.entity.UserDistributionProfile user) {
        app.finish("EXPIRED","EXPIRED",LocalDateTime.now(clock));user.expirePreRegistration();record(app.getId(),"EXPIRED");
    }
    private void record(Long id,String code) {
        jdbc.update("INSERT INTO subordinate_pre_registration_attempt(application_id,reason_code,checked_at) VALUES (?,?,?)",id,code,LocalDateTime.now(clock));
    }
}
