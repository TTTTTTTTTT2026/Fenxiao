package com.fenxiao.distribution.api;

import com.fenxiao.distribution.api.dto.*;
import com.fenxiao.distribution.entity.*;
import com.fenxiao.distribution.repository.*;
import com.fenxiao.distribution.service.*;
import com.fenxiao.identity.domain.AccountStatus;
import com.fenxiao.identity.service.UserSessionService;
import com.fenxiao.platform.dto.VerifyPlatformBindingRequest;
import com.fenxiao.platform.entity.PlatformVerificationMock;
import com.fenxiao.platform.repository.PlatformVerificationMockRepository;
import com.fenxiao.platform.service.*;
import com.fenxiao.user.entity.UserDistributionProfile;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.*;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import java.time.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ActiveProfiles("test")
@AutoConfigureMockMvc
@SpringBootTest(properties={"app.platform-verification.source=MOCK","app.linky-verification.source=MOCK",
        "app.pre-registration.scheduler-enabled=false","app.distribution.reward-engine.enabled=false"})
class PreRegistrationIntegrationTest {
    @TestConfiguration static class TimeConfig {
        @Bean @Primary MutableClock preregistrationTestClock(){return new MutableClock();}
    }
    static class MutableClock extends Clock {
        volatile Instant current=Instant.now();
        public ZoneId getZone(){return ZoneOffset.UTC;}
        public Clock withZone(ZoneId zone){return this;}
        public Instant instant(){return current;}
    }
    private static final AtomicLong IDS=new AtomicLong(870000);
    @Autowired MutableClock clock;
    @Autowired PreRegistrationService service;
    @Autowired PreRegistrationCoordinator coordinator;
    @Autowired PreRegistrationWorker worker;
    @Autowired SubordinatePreRegistrationRepository applications;
    @Autowired UserDistributionProfileRepository users;
    @Autowired DistributionBindingService registration;
    @Autowired PlatformLifecycleService timo;
    @Autowired InviteBindingRegistrationService linky;
    @Autowired PlatformVerificationMockRepository mocks;
    @Autowired PhoneVerificationCodeRepository codes;
    @Autowired PhoneAuthService auth;
    @Autowired UserSessionService sessions;
    @Autowired InvitationProgressService progress;
    @Autowired JdbcTemplate jdbc;
    @Autowired MockMvc mvc;
    @SpyBean MockPlatformVerificationProvider provider;
    @BeforeEach void resetTime(){clock.current=Instant.now();}
    @AfterEach void resetProvider(){reset(provider);}

    @Test void pendingAccountHasNoSessionOrFormalTeamMembership() {
        var inviter=inviter("TIMO");var input=input("TIMO");Long id=create(inviter,input);
        coordinator.process(id);
        var app=applications.findById(id).orElseThrow();var user=users.findById(app.getUserId()).orElseThrow();
        assertThat(user.getAccountStatus()).isEqualTo(AccountStatus.PRE_REGISTERED);
        assertThat(user.getApiAccessToken()).isNull();
        assertThatThrownBy(()->sessions.issue(user.getUserId())).isInstanceOf(RuntimeException.class);
        assertThat(count("distribution_relation","user_id",user.getUserId())).isZero();
        assertThat(count("team_membership_version","user_id",user.getUserId())).isZero();
        assertThat(progress.get(inviter.getUserId(),"TIMO",0,20).total()).isZero();
        assertThat(app.getStatus()).isEqualTo("PENDING");
        assertThat(app.getAttemptCount()).isEqualTo(1);
        assertThat(count("subordinate_pre_registration_attempt","application_id",id)).isEqualTo(1);
    }
    @Test void timoSuccessActivatesAndUsesOfficialJoinTimeAndCorrectInviter() {
        var inviter=inviter("TIMO");var input=input("TIMO");mock(input,true);
        Long id=create(inviter,input);coordinator.process(id);
        var app=applications.findById(id).orElseThrow();var user=users.findById(app.getUserId()).orElseThrow();
        assertThat(app.getStatus()).isEqualTo("COMPLETED");assertThat(user.getAccountStatus()).isEqualTo(AccountStatus.ACTIVE);
        var binding=timo.getBinding(user.getUserId(),"TIMO");
        assertThat(binding.getPlatformUserId()).isEqualTo(input.platformUserId());
        assertThat(binding.getOfficialJoinedAt()).isEqualTo(LocalDateTime.of(2026,11,1,0,0));
        assertThat(jdbc.queryForObject("SELECT level1_inviter_id FROM distribution_relation WHERE user_id=?",Long.class,user.getUserId())).isEqualTo(inviter.getUserId());
        assertThat(progress.countVerified(inviter.getUserId(),"TIMO")).isEqualTo(1);
        coordinator.process(id);assertThat(count("platform_account_binding","user_id",user.getUserId())).isEqualTo(1);
    }
    @Test void linkySuccessAndFailureUseTheOriginalRegistrationFlow() {
        var inviter=inviter("LINKY");var good=input("LINKY");mock(good,true);
        Long id=create(inviter,good);coordinator.process(id);
        var app=applications.findById(id).orElseThrow();assertThat(app.getStatus()).isEqualTo("COMPLETED");
        assertThat(jdbc.queryForObject("SELECT phone_number FROM linky_account_binding WHERE user_id=?",String.class,app.getUserId())).isEqualTo(good.phoneNumber());
        assertThat(count("user_product_ownership","user_id",app.getUserId())).isEqualTo(1);
        var waiting=input("LINKY");Long pending=create(inviter,waiting);coordinator.process(pending);
        var failed=applications.findById(pending).orElseThrow();assertThat(failed.getStatus()).isEqualTo("PENDING");
        assertThat(users.findById(failed.getUserId()).orElseThrow().getAccountStatus()).isEqualTo(AccountStatus.PRE_REGISTERED);
        assertThat(count("distribution_relation","user_id",failed.getUserId())).isZero();
        assertThat(count("linky_account_binding","user_id",failed.getUserId())).isZero();
        assertThat(count("linky_verification_attempt","user_id",failed.getUserId())).isEqualTo(1);
    }
    @Test void phoneOwnerClaimsSameAccountWithoutNewInviteCodeAndApplicationContinues() {
        var inviter=inviter("TIMO");var input=input("TIMO");Long id=create(inviter,input);coordinator.process(id);
        Long userId=applications.findById(id).orElseThrow().getUserId();
        var login=claim(input.phoneNumber());assertThat(login.profile().getUserId()).isEqualTo(userId);
        assertThat(users.findById(userId).orElseThrow().getAccountStatus()).isEqualTo(AccountStatus.ACTIVE);
        assertThat(users.findById(userId).orElseThrow().getClaimedAt()).isNotNull();
        assertThat(applications.findById(id).orElseThrow().getStatus()).isEqualTo("PENDING");
        mock(input,true);coordinator.process(id);assertThat(applications.findById(id).orElseThrow().getStatus()).isEqualTo("COMPLETED");
        assertThat(count("distribution_relation","user_id",userId)).isEqualTo(1);
    }
    @Test void expiryReleasesUnclaimedPhoneAndAccountButKeepsHistory() {
        var inviter=inviter("TIMO");var input=input("TIMO");Long id=create(inviter,input);coordinator.process(id);
        var before=applications.findById(id).orElseThrow();clock.current=before.getExpiresAt().toInstant(ZoneOffset.UTC);
        coordinator.process(id);var user=users.findById(before.getUserId()).orElseThrow();
        assertThat(user.getAccountStatus()).isEqualTo(AccountStatus.PRE_REGISTRATION_EXPIRED);assertThat(user.getPhoneNumber()).isNull();
        assertThat(applications.findById(id).orElseThrow().getStatus()).isEqualTo("EXPIRED");
        assertThat(count("subordinate_pre_registration_attempt","application_id",id)).isEqualTo(2);
        Long next=create(inviter,input);assertThat(next).isNotEqualTo(id);
        assertThat(applications.findById(next).orElseThrow().getUserId()).isNotEqualTo(before.getUserId());
    }
    @Test void expiryPreservesClaimedAccountAndItsRelationship() {
        var inviter=inviter("TIMO");var input=input("TIMO");Long id=create(inviter,input);claim(input.phoneNumber());
        var app=applications.findById(id).orElseThrow();clock.current=app.getExpiresAt().toInstant(ZoneOffset.UTC).plusSeconds(1);
        coordinator.process(id);var user=users.findById(app.getUserId()).orElseThrow();
        assertThat(user.getAccountStatus()).isEqualTo(AccountStatus.ACTIVE);assertThat(user.getPhoneNumber()).isEqualTo(input.phoneNumber());
        assertThat(count("distribution_relation","user_id",user.getUserId())).isEqualTo(1);
        assertThat(applications.findById(id).orElseThrow().getStatus()).isEqualTo("EXPIRED");
        assertThat(sessions.issue(user.getUserId()).accessToken()).isNotBlank();
    }
    @Test void lateSuccessRollsBackEveryBindingAndActivationWrite() throws Exception {
        var inviter=inviter("TIMO");var input=input("TIMO");mock(input,true);Long id=create(inviter,input);
        var app=applications.findById(id).orElseThrow();var entered=new CountDownLatch(1);var release=new CountDownLatch(1);
        doAnswer(invocation->{entered.countDown();assertThat(release.await(10,TimeUnit.SECONDS)).isTrue();return invocation.callRealMethod();}).when(provider).verify(any());
        var running=CompletableFuture.runAsync(()->coordinator.process(id));assertThat(entered.await(10,TimeUnit.SECONDS)).isTrue();
        clock.current=app.getExpiresAt().toInstant(ZoneOffset.UTC);release.countDown();running.get(15,TimeUnit.SECONDS);
        assertThat(applications.findById(id).orElseThrow().getStatus()).isEqualTo("EXPIRED");
        assertThat(users.findById(app.getUserId()).orElseThrow().getAccountStatus()).isEqualTo(AccountStatus.PRE_REGISTRATION_EXPIRED);
        assertThat(count("platform_account_binding","user_id",app.getUserId())).isZero();
        assertThat(count("distribution_relation","user_id",app.getUserId())).isZero();
    }
    @Test void editChangesPhoneCountryAndIdWithoutExtendingDeadlineAndRejectsStaleEdits() {
        var inviter=inviter("TIMO");var original=input("TIMO");Long id=create(inviter,original);
        var before=applications.findById(id).orElseThrow();var replacement=input("TIMO");
        var change=new PreRegistrationRequest("BR","+551199"+IDS.incrementAndGet(),"TIMO",replacement.platformUserId(),before.getRevision());
        service.edit(inviter.getUserId(),id,change,"test");var after=applications.findById(id).orElseThrow();
        assertThat(after.getExpiresAt()).isEqualTo(before.getExpiresAt());assertThat(after.getPhoneNumber()).isEqualTo(change.phoneNumber());
        assertThat(users.findByPhoneNumber(original.phoneNumber())).isEmpty();
        assertThatThrownBy(()->service.edit(inviter.getUserId(),id,change,"test")).hasMessage("PRE_STALE_REVISION");
        worker.deferred(id,before.getRevision(),"SOURCE_UNAVAILABLE");
        assertThat(applications.findById(id).orElseThrow().getReasonCode()).isEqualTo("WAITING");
    }
    @Test void claimedOwnerPhoneCannotBeChangedByInviter() {
        var inviter=inviter("TIMO");var input=input("TIMO");Long id=create(inviter,input);claim(input.phoneNumber());
        var app=applications.findById(id).orElseThrow();var other=input("TIMO");
        assertThatThrownBy(()->service.edit(inviter.getUserId(),id,new PreRegistrationRequest("ID",other.phoneNumber(),"TIMO",other.platformUserId(),app.getRevision()),"test"))
                .hasMessage("PRE_CLAIMED_PHONE_LOCKED");
        service.edit(inviter.getUserId(),id,new PreRegistrationRequest("ID",input.phoneNumber(),"TIMO",other.platformUserId(),app.getRevision()),"test");
        assertThat(users.findById(app.getUserId()).orElseThrow().getPhoneNumber()).isEqualTo(input.phoneNumber());
    }
    @Test void withdrawReleasesOnlyUnclaimedAccountAndPreservesRequest() {
        var inviter=inviter("TIMO");var input=input("TIMO");Long id=create(inviter,input);
        service.withdraw(inviter.getUserId(),id,applications.findById(id).orElseThrow().getRevision(),"test");
        assertThat(applications.findById(id).orElseThrow().getStatus()).isEqualTo("WITHDRAWN");
        assertThat(users.findByPhoneNumber(input.phoneNumber())).isEmpty();
        assertThat(service.list(inviter.getUserId(),0,20).total()).isEqualTo(1);
    }
    @Test void rejectsExistingNormalFrozenCancelledAndPendingPhones() {
        var inviter=inviter("TIMO");
        for(var status:new AccountStatus[]{AccountStatus.ACTIVE,AccountStatus.FROZEN,AccountStatus.CANCELLED}) {
            var existing=user();if(status==AccountStatus.FROZEN)existing.freezeAccount();if(status==AccountStatus.CANCELLED)existing.cancelAccount(LocalDateTime.now());users.save(existing);
            var input=input("TIMO");assertThatThrownBy(()->create(inviter,new PreRegistrationRequest("ID",existing.getPhoneNumber(),"TIMO",input.platformUserId(),null))).hasMessage("PRE_PHONE_EXISTS");
        }
        var input=input("TIMO");create(inviter,input);assertThatThrownBy(()->create(inviter,input)).hasMessage("PRE_PHONE_EXISTS");
    }
    @Test void reservedAppIdCannotBeTakenByAnotherPreRegistrationOrSelfSubmission() {
        for(String platform:new String[]{"TIMO","LINKY"}) {
            var inviter=inviter(platform);var input=input(platform);create(inviter,input);var other=input(platform);
            assertThatThrownBy(()->create(inviter,new PreRegistrationRequest("ID",other.phoneNumber(),platform,input.platformUserId(),null))).hasMessage("PRE_ACCOUNT_RESERVED");
            var user=user();
            assertThatThrownBy(()->{if(platform.equals("TIMO"))timo.submit(user.getUserId(),platform,input.platformUserId());else linky.registerForUser(user.getUserId(),new RegisterLinkyAccountRequest(platform,input.platformUserId()));}).hasMessage("PRE_ACCOUNT_RESERVED");
        }
    }
    @Test void concurrentPhoneApplicationsCreateOnlyOneProfile() throws Exception {
        var inviter=inviter("TIMO");var input=input("TIMO");var start=new CountDownLatch(1);
        Callable<Boolean> submit=()->{start.await();try{create(inviter,input);return true;}catch(RuntimeException exception){return false;}};
        var pool=Executors.newFixedThreadPool(2);
        try {var first=pool.submit(submit);var second=pool.submit(submit);start.countDown();assertThat(first.get(15,TimeUnit.SECONDS)^second.get(15,TimeUnit.SECONDS)).isTrue();}
        finally{pool.shutdownNow();}
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM user_distribution_profile WHERE phone_number=?",Integer.class,input.phoneNumber())).isEqualTo(1);
    }
    @Test void simultaneousClaimAndVerificationKeepOneIdentityAndRelationship() throws Exception {
        var inviter=inviter("TIMO");var input=input("TIMO");mock(input,true);Long id=create(inviter,input);
        var start=new CountDownLatch(1);var pool=Executors.newFixedThreadPool(2);
        try {
            var verify=pool.submit(()->{start.await();coordinator.process(id);return true;});
            var claim=pool.submit(()->{start.await();return claim(input.phoneNumber());});start.countDown();
            assertThat(verify.get(15,TimeUnit.SECONDS)).isTrue();assertThat(claim.get(15,TimeUnit.SECONDS).profile().getUserId()).isEqualTo(applications.findById(id).orElseThrow().getUserId());
        }finally{pool.shutdownNow();}
        var app=applications.findById(id).orElseThrow();assertThat(app.getStatus()).isEqualTo("COMPLETED");
        assertThat(count("distribution_relation","user_id",app.getUserId())).isEqualTo(1);
    }
    @Test void apiEnforcesActorQualificationOwnershipAndMasksLists() throws Exception {
        var inviter=inviter("TIMO");var input=input("TIMO");Long id=create(inviter,input);var token=sessions.issue(inviter.getUserId()).accessToken();
        String response=mvc.perform(get(path(inviter)).header("X-Distribution-Token",token)).andExpect(status().isOk()).andExpect(jsonPath("$.items[0].canEdit").value(true)).andReturn().getResponse().getContentAsString();
        assertThat(response).doesNotContain(input.phoneNumber()).doesNotContain(input.platformUserId());
        var stranger=inviter("TIMO");var otherToken=sessions.issue(stranger.getUserId()).accessToken();
        mvc.perform(get(path(inviter)).header("X-Distribution-Token",otherToken)).andExpect(status().isForbidden());
        mvc.perform(get(path(stranger)+"/"+id+"/edit-input").header("X-Distribution-Token",otherToken)).andExpect(status().isForbidden());
        var unqualified=user();assertThatThrownBy(()->create(unqualified,input("TIMO"))).isInstanceOf(com.fenxiao.common.api.ForbiddenException.class);
        assertThatThrownBy(()->create(inviter,new PreRegistrationRequest("BR","+628123456789","TIMO","123456789012",null))).hasMessage("PRE_INVALID_PHONE");
        assertThatThrownBy(()->create(inviter,new PreRegistrationRequest("ID",input("TIMO").phoneNumber(),"TIMO","123",null))).hasMessage("PRE_INVALID_ACCOUNT");
    }
    @Test void backgroundSchedulerRetriesMembershipWithoutRequiringInviterToReturn() {
        var inviter=inviter("TIMO");var input=input("TIMO");mock(input,false);Long id=create(inviter,input);coordinator.process(id);
        assertThat(applications.findById(id).orElseThrow().getReasonCode()).isEqualTo("NOT_IN_GUILD");
        var sample=mocks.findByPlatformCodeAndPlatformUserId("TIMO",input.platformUserId()).orElseThrow();
        sample.update(false,true,"22000408",LocalDateTime.of(2026,11,1,0,0),"fixture",true);mocks.save(sample);
        clock.current=clock.current.plusSeconds(120);
        new PreRegistrationCoordinator(applications,worker,clock,true).poll();
        assertThat(applications.findById(id).orElseThrow().getStatus()).isEqualTo("COMPLETED");
    }
    @Test void wrongVerificationCodeCannotClaimPreRegisteredAccount() {
        var inviter=inviter("TIMO");var input=input("TIMO");Long id=create(inviter,input);
        codes.save(PhoneVerificationCode.issue(input.phoneNumber(),"654321","LOGIN",LocalDateTime.now().plusMinutes(10)));
        assertThatThrownBy(()->auth.login(new PhoneLoginRequest(input.phoneNumber(),"000000",null,null,null))).hasMessage("verification code invalid");
        assertThat(users.findById(applications.findById(id).orElseThrow().getUserId()).orElseThrow().getAccountStatus()).isEqualTo(AccountStatus.PRE_REGISTERED);
    }
    @Test void concurrentSelfBindingAndPreRegistrationCannotClaimSameAppAccount() throws Exception {
        var inviter=inviter("TIMO");var input=input("TIMO");var owner=user();var start=new CountDownLatch(1);var pool=Executors.newFixedThreadPool(2);
        try {
            var pre=pool.submit(()->{start.await();try{create(inviter,input);return true;}catch(RuntimeException exception){return false;}});
            var self=pool.submit(()->{start.await();try{timo.submit(owner.getUserId(),"TIMO",input.platformUserId());return true;}catch(RuntimeException exception){return false;}});
            start.countDown();assertThat(pre.get(15,TimeUnit.SECONDS)^self.get(15,TimeUnit.SECONDS)).isTrue();
        }finally{pool.shutdownNow();}
    }
    @Test void withdrawingClaimedRequestKeepsNormalAccountAndIncome() {
        var inviter=inviter("TIMO");var input=input("TIMO");Long id=create(inviter,input);claim(input.phoneNumber());
        var app=applications.findById(id).orElseThrow();var user=users.findById(app.getUserId()).orElseThrow();
        user.addConfirmedIncome(new java.math.BigDecimal("120.50"));users.save(user);
        service.withdraw(inviter.getUserId(),id,app.getRevision(),"test");
        var retained=users.findById(app.getUserId()).orElseThrow();assertThat(retained.getAccountStatus()).isEqualTo(AccountStatus.ACTIVE);
        assertThat(retained.getPhoneNumber()).isEqualTo(input.phoneNumber());assertThat(retained.getConfirmedIncomeTotal()).isEqualByComparingTo("120.50");
    }
    @Test void legacyPhoneFormattingStillCountsAsAnExistingAccount() {
        var inviter=inviter("TIMO");var input=input("TIMO");var legacy=user();
        legacy.bindPhoneNumber(input.phoneNumber().substring(1));users.save(legacy);
        assertThatThrownBy(()->create(inviter,input)).hasMessage("PRE_PHONE_EXISTS");
    }
    @Test void adminUnfreezeCannotTurnAnUnclaimedUnverifiedAccountIntoNormal() {
        var inviter=inviter("TIMO");var input=input("TIMO");Long id=create(inviter,input);
        var app=applications.findById(id).orElseThrow();var user=users.findById(app.getUserId()).orElseThrow();
        user.freezeAccount();user.activateAccount();users.save(user);
        assertThat(users.findById(app.getUserId()).orElseThrow().getAccountStatus()).isEqualTo(AccountStatus.PRE_REGISTERED);
        user.freezeAccount();users.save(user);clock.current=app.getExpiresAt().toInstant(ZoneOffset.UTC);coordinator.process(id);
        assertThat(users.findByPhoneNumber(input.phoneNumber())).isEmpty();
    }
    @Test void phoneOwnerCanClaimUsingAnEquivalentInternationalNumber() {
        var inviter=inviter("TIMO");var input=input("TIMO");Long id=create(inviter,input);
        var result=claim(input.phoneNumber().substring(1));
        assertThat(result.profile().getUserId()).isEqualTo(applications.findById(id).orElseThrow().getUserId());
        assertThat(result.profile().getPhoneNumber()).isEqualTo(input.phoneNumber());
    }
    private String path(UserDistributionProfile user){return "/api/distribution/team/"+user.getUserId()+"/pre-registrations";}
    private Long create(UserDistributionProfile inviter,PreRegistrationRequest request){return service.create(inviter.getUserId(),request,"test");}
    private PreRegistrationRequest input(String platform){long n=IDS.incrementAndGet();return new PreRegistrationRequest("ID","+628811"+n,platform,platform.equals("TIMO")?Long.toString(400000000000L+n):Long.toString(10000000L+n),null);}
    private UserDistributionProfile user(){long n=IDS.incrementAndGet();var user=registration.createProfile(n,"ID","id",null);user.bindPhoneNumber("+628899"+n);return users.save(user);}
    private UserDistributionProfile inviter(String platform){var user=user();String account=platform.equals("TIMO")?Long.toString(400000000000L+user.getUserId()):Long.toString(10000000L+user.getUserId());
        if(platform.equals("TIMO")){var binding=timo.submit(user.getUserId(),platform,account);timo.verify(new VerifyPlatformBindingRequest(platform,account,false,true,"22000408",LocalDateTime.now(),"LOCAL_MOCK","fixture",binding.getId()));}
        else{mock(new PreRegistrationRequest("ID",user.getPhoneNumber(),platform,account,null),true);linky.registerForUser(user.getUserId(),new RegisterLinkyAccountRequest(platform,account));}return user;}
    private void mock(PreRegistrationRequest input,boolean joined){mocks.save(PlatformVerificationMock.create(input.platformCode(),input.platformUserId(),false,joined,input.platformCode().equals("TIMO")?"22000408":"LINKY_DEFAULT_GUILD",LocalDateTime.of(2026,11,1,0,0),"fixture",true));}
    private PhoneAuthService.LoginResult claim(String phone){codes.save(PhoneVerificationCode.issue(phone,"654321","LOGIN",LocalDateTime.now(Clock.systemUTC()).plusMinutes(10)));return auth.login(new PhoneLoginRequest(phone,"654321",null,null,null));}
    private int count(String table,String column,Long value){return jdbc.queryForObject("SELECT COUNT(*) FROM "+table+" WHERE "+column+"=?",Integer.class,value);}
}
