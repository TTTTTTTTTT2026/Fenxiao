package com.fenxiao.distribution.service;

import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.common.api.ForbiddenException;
import com.fenxiao.distribution.api.dto.*;
import com.fenxiao.distribution.entity.SubordinatePreRegistration;
import com.fenxiao.distribution.repository.SubordinatePreRegistrationRepository;
import com.fenxiao.identity.domain.AccountStatus;
import com.fenxiao.user.entity.UserDistributionProfile;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;

@Service
@Transactional
public class PreRegistrationService {
    @jakarta.persistence.PersistenceContext private jakarta.persistence.EntityManager entityManager;
    private static final Map<String,String> PREFIXES=Map.of("CN","+86","ID","+62","MX","+52","CO","+57",
            "CL","+56","VE","+58","PE","+51","BR","+55","HK","+852");
    private final SubordinatePreRegistrationRepository applications;
    private final UserDistributionProfileRepository users;
    private final DistributionBindingService registration;
    private final InvitationProgressService progress;
    private final RegistrationClaimGuard guard;
    private final PreRegistrationExpiryService expiry;
    private final OperationAuditLogRepository audits;
    private final JdbcTemplate jdbc;
    private final Clock clock;
    public PreRegistrationService(SubordinatePreRegistrationRepository applications, UserDistributionProfileRepository users,
            DistributionBindingService registration, InvitationProgressService progress, RegistrationClaimGuard guard,
            PreRegistrationExpiryService expiry, OperationAuditLogRepository audits, JdbcTemplate jdbc, Clock clock) {
        this.applications=applications; this.users=users; this.registration=registration; this.progress=progress;
        this.guard=guard; this.expiry=expiry; this.audits=audits; this.jdbc=jdbc; this.clock=clock;
    }
    public Long create(Long inviterId, PreRegistrationRequest request, String ip) {
        var input=normalize(request);
        guard.lock("PHONE:"+input.phoneNumber(), input.platformCode()+":"+input.platformUserId());
        expiry.expireForPhone(input.phoneNumber());
        requireInviter(inviterId,input.platformCode());
        if (phoneExists(input.phoneNumber(), -1L)) throw new IllegalStateException("PRE_PHONE_EXISTS");
        assertUnclaimedAccount(null,input);
        long userId=9000000000L+Math.abs((long)input.phoneNumber().hashCode());
        while (users.existsById(userId)) userId++;
        var user=registration.createPreRegistration(userId,input.countryCode(), language(input.countryCode()),input.phoneNumber(),inviterId);
        var app=applications.saveAndFlush(SubordinatePreRegistration.create(inviterId,user.getUserId(),input.countryCode(),
                input.phoneNumber(),input.platformCode(),input.platformUserId(),LocalDateTime.now(clock)));
        audit(app,inviterId,"CREATE",ip);
        return app.getId();
    }
    public void edit(Long inviterId, Long id, PreRegistrationRequest request, String ip) {
        var before=owned(inviterId,id);
        var input=normalize(request);
        guard.lock("PHONE:"+before.getPhoneNumber(), before.getPlatformCode()+":"+before.getPlatformUserId(),
                "PHONE:"+input.phoneNumber(),input.platformCode()+":"+input.platformUserId());
        for(long lockId:new long[]{Math.min(inviterId,before.getUserId()),Math.max(inviterId,before.getUserId())}) users.findByIdForBinding(lockId).orElseThrow();
        var user=users.findByIdForBinding(before.getUserId()).orElseThrow();
        var app=applications.lockById(id).orElseThrow();
        entityManager.refresh(app);
        requireEditable(app,user,request.revision());
        requireInviter(inviterId,input.platformCode());
        if (user.getAccountStatus()!=AccountStatus.PRE_REGISTERED && (!app.getPhoneNumber().equals(input.phoneNumber())
                || !app.getCountryCode().equals(input.countryCode()))) throw new IllegalStateException("PRE_CLAIMED_PHONE_LOCKED");
        expiry.expireForPhone(input.phoneNumber());
        if (phoneExists(input.phoneNumber(),user.getUserId())) throw new IllegalStateException("PRE_PHONE_EXISTS");
        assertUnclaimedAccount(user.getUserId(),input);
        if (hasBinding(user.getUserId(),app.getPlatformCode())) throw new IllegalStateException("PRE_ACCOUNT_CHANGED");
        String prior=app.getPlatformCode()+":"+InvitationProgressService.maskAccount(app.getPlatformUserId())+":"+InvitationProgressService.maskPhone(app.getPhoneNumber());
        app.edit(input.countryCode(),input.phoneNumber(),input.platformCode(),input.platformUserId(),LocalDateTime.now(clock));
        user.bindPhoneNumber(input.phoneNumber()); user.changeCountry(input.countryCode());
        audits.save(OperationAuditLog.create(inviterId,"INVITER","PRE_REGISTRATION","PRE_REGISTRATION",app.getId(),"EDIT",prior,
                app.getPlatformCode()+":"+InvitationProgressService.maskAccount(app.getPlatformUserId())+":"+InvitationProgressService.maskPhone(app.getPhoneNumber()),ip,
                "Inviter edited pre-registration without extending its deadline",LocalDateTime.now(clock)));
        applications.flush();
    }
    public void withdraw(Long inviterId, Long id, long revision, String ip) {
        var before=owned(inviterId,id);
        var user=users.findByIdForBinding(before.getUserId()).orElseThrow();
        var app=applications.lockById(id).orElseThrow();
        entityManager.refresh(app);
        requireEditable(app,user,revision);
        if (hasBinding(user.getUserId(),app.getPlatformCode())) throw new IllegalStateException("PRE_ACCOUNT_CHANGED");
        app.finish("WITHDRAWN","WITHDRAWN",LocalDateTime.now(clock)); user.expirePreRegistration();
        audit(app,inviterId,"WITHDRAW",ip);
    }
    @Transactional(readOnly=true)
    public PreRegistrationResponse list(Long inviterId,int page,int size) {
        if(page<0 || size<1 || size>50) throw new IllegalArgumentException("invalid pagination");
        var result=applications.findByInviterIdOrderByIdDesc(inviterId,PageRequest.of(page,size));
        return new PreRegistrationResponse(result.stream().map(this::item).toList(),page,result.getTotalElements(),result.hasNext(),
                progress.verified(inviterId,"TIMO"),progress.verified(inviterId,"LINKY"));
    }
    @Transactional(readOnly=true)
    public PreRegistrationResponse.Item get(Long inviterId,Long id) { return item(owned(inviterId,id)); }
    @Transactional(readOnly=true)
    public PreRegistrationRequest editInput(Long inviterId,Long id) {
        var app=owned(inviterId,id);
        if(!item(app).canEdit()) throw new IllegalStateException("PRE_CLOSED");
        return new PreRegistrationRequest(app.getCountryCode(),app.getPhoneNumber(),app.getPlatformCode(),app.getPlatformUserId(),app.getRevision());
    }
    private SubordinatePreRegistration owned(Long inviterId,Long id) {
        return applications.findById(id).filter(a->a.getInviterId().equals(inviterId))
                .orElseThrow(()->new ForbiddenException("pre-registration access denied"));
    }
    private PreRegistrationResponse.Item item(SubordinatePreRegistration app) {
        var user=users.findById(app.getUserId()).orElseThrow();
        return new PreRegistrationResponse.Item(app.getId(),app.getUserId(),app.getCountryCode(),
                InvitationProgressService.maskPhone(app.getPhoneNumber()),app.getPlatformCode(),
                InvitationProgressService.maskAccount(app.getPlatformUserId()),app.getStatus(),app.getReasonCode(),
                app.getSubmittedAt().toString(),app.getExpiresAt().toString(),
                app.getLastCheckedAt()==null?null:app.getLastCheckedAt().toString(),app.getAttemptCount(),app.getRevision(),
                user.getClaimedAt()!=null,app.pending() && LocalDateTime.now(clock).isBefore(app.getExpiresAt())
                && (user.getAccountStatus()==AccountStatus.ACTIVE || user.getAccountStatus()==AccountStatus.PRE_REGISTERED)
                && !hasBinding(user.getUserId(),app.getPlatformCode()));
    }
    private void requireEditable(SubordinatePreRegistration app,UserDistributionProfile user,Long revision) {
        if(!app.pending() || !LocalDateTime.now(clock).isBefore(app.getExpiresAt())) throw new IllegalStateException("PRE_CLOSED");
        if(revision==null || revision!=app.getRevision()) throw new IllegalStateException("PRE_STALE_REVISION");
        if(user.getAccountStatus()!=AccountStatus.PRE_REGISTERED && user.getAccountStatus()!=AccountStatus.ACTIVE)
            throw new IllegalStateException("PRE_ACCOUNT_INACTIVE");
    }
    private void requireInviter(Long inviterId,String platform) {
        var inviter=users.findByIdForBinding(inviterId).orElseThrow();
        if(inviter.getAccountStatus()!=AccountStatus.ACTIVE || !progress.verified(inviterId,platform))
            throw new ForbiddenException("PRE_INVITER_NOT_VERIFIED");
    }
    private void assertUnclaimedAccount(Long userId,PreRegistrationRequest input) {
        guard.assertAccountAvailable(userId==null?-1L:userId,input.platformCode(),input.platformUserId());
        String sql="TIMO".equals(input.platformCode())
                ? "SELECT COUNT(*) FROM platform_account_binding WHERE platform_code='TIMO' AND platform_user_id=?"
                : "SELECT COUNT(*) FROM linky_account_binding WHERE linky_account=? AND user_id IS NOT NULL";
        if(jdbc.queryForObject(sql,Integer.class,input.platformUserId())>0) throw new IllegalStateException("PRE_ACCOUNT_EXISTS");
        if("LINKY".equals(input.platformCode()) && jdbc.queryForObject("SELECT COUNT(*) FROM invite_binding_registration WHERE linky_account=?",
                Integer.class,input.platformUserId())>0) throw new IllegalStateException("PRE_ACCOUNT_EXISTS");
    }
    boolean hasBinding(Long user,String platform) {
        return jdbc.queryForObject("TIMO".equals(platform)
                ? "SELECT COUNT(*) FROM platform_account_binding WHERE user_id=? AND platform_code='TIMO'"
                : "SELECT COUNT(*) FROM linky_account_binding WHERE user_id=?",Integer.class,user)>0;
    }
    private boolean phoneExists(String phone,Long excludingUserId) {
        // Retain compatibility with legacy records lacking + or containing display punctuation.
        return jdbc.queryForObject("SELECT COUNT(*) FROM user_distribution_profile WHERE user_id<>? AND REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone_number,'+',''),' ',''),'-',''),'(',''),')','')=?",
                Integer.class,excludingUserId,phone.substring(1))>0;
    }
    private PreRegistrationRequest normalize(PreRegistrationRequest input) {
        String country=input.countryCode().trim().toUpperCase(Locale.ROOT);
        String phone;
        try { phone=PhoneAuthService.normalizePhone(input.phoneNumber()); }
        catch(IllegalArgumentException exception) { throw new IllegalArgumentException("PRE_INVALID_PHONE"); }
        String platform=input.platformCode(); String account=input.platformUserId().trim();
        if(!PREFIXES.containsKey(country) || !phone.startsWith(PREFIXES.get(country)) || phone.length()<=PREFIXES.get(country).length()+3)
            throw new IllegalArgumentException("PRE_INVALID_PHONE");
        if(!Set.of("TIMO","LINKY").contains(platform) || !account.matches("TIMO".equals(platform)?"[1-9][0-9]{11}":"[0-9]{8}"))
            throw new IllegalArgumentException("PRE_INVALID_ACCOUNT");
        return new PreRegistrationRequest(country,phone,platform,account,input.revision());
    }
    private String language(String country) {
        return switch(country){case "CN","HK"->"zh-hk";case "ID"->"id";case "BR"->"pt-br";default->"es-mx";};
    }
    private void audit(SubordinatePreRegistration app,Long actor,String action,String ip) {
        audits.save(OperationAuditLog.create(actor,"INVITER","PRE_REGISTRATION","PRE_REGISTRATION",app.getId(),action,
                null,app.getPlatformCode()+":"+InvitationProgressService.maskAccount(app.getPlatformUserId()),ip,
                "Inviter pre-registration request",LocalDateTime.now(clock)));
    }
}
