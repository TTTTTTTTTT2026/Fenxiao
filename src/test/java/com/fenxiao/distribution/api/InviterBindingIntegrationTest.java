package com.fenxiao.distribution.api;

import com.fenxiao.distribution.api.dto.AssistedBindingRequest;
import com.fenxiao.distribution.api.dto.RegisterLinkyAccountRequest;
import com.fenxiao.distribution.service.*;
import com.fenxiao.identity.service.UserSessionService;
import com.fenxiao.platform.dto.VerifyPlatformBindingRequest;
import com.fenxiao.platform.entity.PlatformVerificationMock;
import com.fenxiao.platform.repository.PlatformVerificationMockRepository;
import com.fenxiao.platform.service.PlatformLifecycleService;
import com.fenxiao.distribution.entity.LinkyVerificationAttempt;
import com.fenxiao.distribution.repository.LinkyVerificationAttemptRepository;
import com.fenxiao.user.entity.UserDistributionProfile;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ActiveProfiles("test")
@AutoConfigureMockMvc
@SpringBootTest(properties = {"app.platform-verification.source=MOCK", "app.linky-verification.source=MOCK",
        "app.distribution.reward-engine.enabled=false", "app.distribution.real-finance.enabled=false"})
class InviterBindingIntegrationTest {
    private static final AtomicLong IDS = new AtomicLong(980000);
    @Autowired DistributionBindingService profiles;
    @Autowired UserDistributionProfileRepository users;
    @Autowired PlatformLifecycleService lifecycle;
    @Autowired PlatformVerificationMockRepository mocks;
    @Autowired InvitationProgressService progress;
    @Autowired InviterBindingService assisted;
    @Autowired InviteBindingRegistrationService linky;
    @Autowired UserSessionService sessions;
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired LinkyVerificationAttemptRepository linkyAttempts;

    @Test void timoSubmissionUsesInviteeIdentityAndTheNormalVerificationFlow() throws Exception {
        var inviter = user(null);
        verifyTimo(inviter);
        var invitee = user(inviter);
        String account = timoId(invitee);
        mockAccount("TIMO", account, "22000408");
        String token = sessions.issue(inviter.getUserId()).accessToken();
        mvc.perform(get("/api/distribution/team/{id}/invitation-progress", inviter.getUserId())
                        .header("X-Distribution-Token", token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items[0].canBind").value(true));
        submit(inviter, invitee, token, "TIMO", account).andExpect(status().isOk())
                .andExpect(jsonPath("$.bindingStatus").value("VERIFIED"))
                .andExpect(jsonPath("$.maskedAccount").value("••••" + account.substring(8)))
                .andExpect(jsonPath("$.canBind").value(false));
        var binding = lifecycle.getBinding(invitee.getUserId(), "TIMO");
        assertThat(binding.getPlatformUserId()).isEqualTo(account);
        assertThat(binding.getOfficialGuildId()).isEqualTo("22000408");
        assertThat(users.findById(invitee.getUserId()).orElseThrow().getPhoneNumber()).isEqualTo(invitee.getPhoneNumber());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM operation_audit_log WHERE module_name='INVITER_BINDING' AND operator_id=? AND target_id=? AND action_name='SUBMIT_TIMO'", Integer.class,
                inviter.getUserId(), invitee.getUserId())).isEqualTo(1);
        String audit = jdbc.queryForObject("SELECT after_data FROM operation_audit_log WHERE module_name='INVITER_BINDING' AND target_id=?", String.class, invitee.getUserId());
        assertThat(audit).doesNotContain(account).contains(account.substring(8));
        assertThat(progress.get(inviter.getUserId(), "TIMO", 0, 20).items().getFirst().canBind()).isFalse();
    }

    @Test void linkySubmissionUsesTheInviteesPhoneAndOwnership() throws Exception {
        var inviter = user(null);
        verifyLinky(inviter);
        var invitee = user(inviter);
        String account = linkyId(invitee);
        mockAccount("LINKY", account, "LINKY_DEFAULT_GUILD");
        submit(inviter, invitee, sessions.issue(inviter.getUserId()).accessToken(), "LINKY", account)
                .andExpect(status().isOk()).andExpect(jsonPath("$.bindingStatus").value("VERIFIED"));
        assertThat(jdbc.queryForObject("SELECT phone_number FROM linky_account_binding WHERE user_id=?", String.class, invitee.getUserId()))
                .isEqualTo(invitee.getPhoneNumber()).isNotEqualTo(inviter.getPhoneNumber());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM user_product_ownership WHERE user_id=? AND product_code='LINKY'", Integer.class, invitee.getUserId())).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT inviter_user_id FROM invite_binding_registration WHERE linky_account=?", Long.class, account))
                .isEqualTo(inviter.getUserId());
    }

    @Test void requiresVerifiedBindingForTheSelectedApplication() throws Exception {
        var inviter = user(null);
        var invitee = user(inviter);
        String token = sessions.issue(inviter.getUserId()).accessToken();
        submit(inviter, invitee, token, "TIMO", timoId(invitee)).andExpect(status().isForbidden());
        verifyTimo(inviter);
        submit(inviter, invitee, token, "LINKY", linkyId(invitee)).andExpect(status().isForbidden());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM operation_audit_log WHERE module_name='INVITER_BINDING' AND target_id=?", Integer.class, invitee.getUserId())).isZero();
    }

    @Test void rejectsForgedIdentityAndIndirectOrUnrelatedInvitees() throws Exception {
        var inviter = user(null);
        verifyTimo(inviter);
        var direct = user(inviter);
        var indirect = user(direct);
        var stranger = user(null);
        String token = sessions.issue(inviter.getUserId()).accessToken();
        submit(inviter, indirect, token, "TIMO", timoId(indirect)).andExpect(status().isForbidden());
        submit(inviter, stranger, token, "TIMO", timoId(stranger)).andExpect(status().isForbidden());
        submit(inviter, inviter, token, "TIMO", timoId(inviter)).andExpect(status().isForbidden());
        submit(direct, indirect, token, "TIMO", timoId(indirect)).andExpect(status().isForbidden());
    }

    @Test void rejectsExistingSubmissionsAndDoesNotReplaceTheAccount() throws Exception {
        var inviter = user(null);
        verifyTimo(inviter);
        var invitee = user(inviter);
        String original = timoId(invitee);
        lifecycle.submit(invitee.getUserId(), "TIMO", original);
        submit(inviter, invitee, sessions.issue(inviter.getUserId()).accessToken(), "TIMO", "499999999999")
                .andExpect(status().isBadRequest());
        assertThat(lifecycle.getBinding(invitee.getUserId(), "TIMO").getPlatformUserId()).isEqualTo(original);
    }

    @Test void linkyMissingEvidenceIsNotOfferedAsAnotherFirstSubmission() throws Exception {
        var inviter = user(null);
        verifyLinky(inviter);
        var invitee = user(inviter);
        String token = sessions.issue(inviter.getUserId()).accessToken();
        // The mock channel records a missing sample without claiming verification succeeded.
        submit(inviter, invitee, token, "LINKY", linkyId(invitee)).andExpect(status().isOk())
                .andExpect(jsonPath("$.bindingStatus").value("REJECTED"))
                .andExpect(jsonPath("$.canBind").value(false));
        assertThat(progress.get(inviter.getUserId(), "LINKY", 0, 20).items().getFirst().canBind()).isFalse();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM operation_audit_log WHERE module_name='INVITER_BINDING' AND target_id=?", Integer.class,
                invitee.getUserId())).isEqualTo(1);
        submit(inviter, invitee, token, "LINKY", linkyId(invitee)).andExpect(status().isBadRequest());
    }

    @Test void timoFailureKeepsTheOriginalSubmittedRecord() throws Exception {
        var inviter = user(null);
        verifyTimo(inviter);
        var invitee = user(inviter);
        submit(inviter, invitee, sessions.issue(inviter.getUserId()).accessToken(), "TIMO", timoId(invitee))
                .andExpect(status().isOk()).andExpect(jsonPath("$.bindingStatus").value("SUBMITTED"));
        assertThat(lifecycle.getBinding(invitee.getUserId(), "TIMO").getPlatformUserId()).isEqualTo(timoId(invitee));
    }

    @Test void priorLinkyTimeoutStaysPendingAndCannotBeSubmittedAgainByInviter() throws Exception {
        var inviter = user(null);
        verifyLinky(inviter);
        var invitee = user(inviter);
        linkyAttempts.save(LinkyVerificationAttempt.create(invitee.getUserId(), linkyId(invitee), "LINKY_DEFAULT_GUILD",
                "MCN", "SOURCE_STALE", "UNKNOWN", null, "test-request", null, null, null, "source_timeout", true));
        var item = progress.get(inviter.getUserId(), "LINKY", 0, 20).items().getFirst();
        assertThat(item.bindingStatus()).isEqualTo("VERIFYING");
        assertThat(item.canBind()).isFalse();
        submit(inviter, invitee, sessions.issue(inviter.getUserId()).accessToken(), "LINKY", linkyId(invitee))
                .andExpect(status().isBadRequest());
    }

    @Test void anotherUsersAccountCannotBeClaimedAndExistingOwnerIsPreserved() throws Exception {
        var inviter = user(null);
        verifyTimo(inviter);
        var invitee = user(inviter);
        var owner = user(null);
        lifecycle.submit(owner.getUserId(), "TIMO", timoId(owner));
        submit(inviter, invitee, sessions.issue(inviter.getUserId()).accessToken(), "TIMO", timoId(owner))
                .andExpect(status().isBadRequest());
        assertThat(lifecycle.getBinding(owner.getUserId(), "TIMO").getPlatformUserId()).isEqualTo(timoId(owner));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM platform_account_binding WHERE user_id=?", Integer.class, invitee.getUserId())).isZero();
    }

    @Test void crossCountryInviteeKeepsTheirOwnCountryAndReceivesTheAuthoritativeGuild() throws Exception {
        var inviter = user(null);
        verifyTimo(inviter);
        long id = IDS.incrementAndGet();
        var invitee = profiles.createProfile(id, "CO", "es-mx", inviter.getInviteCode());
        invitee.bindPhoneNumber("+57300" + id);
        users.save(invitee);
        mockAccount("TIMO", timoId(invitee), "22000408");
        submit(inviter, invitee, sessions.issue(inviter.getUserId()).accessToken(), "TIMO", timoId(invitee))
                .andExpect(status().isOk()).andExpect(jsonPath("$.bindingStatus").value("VERIFIED"));
        assertThat(users.findById(id).orElseThrow().getCountryCode()).isEqualTo("CO");
        assertThat(lifecycle.getBinding(id, "TIMO").getOfficialGuildId()).isEqualTo("22000408");
    }

    @Test void simultaneousSelfAndAssistedSubmissionCannotOverwriteEachOther() throws Exception {
        var inviter = user(null);
        verifyTimo(inviter);
        var invitee = user(inviter);
        var start = new CountDownLatch(1);
        var assistedResult = CompletableFuture.supplyAsync(() -> {
            try { start.await(); assisted.submit(inviter.getUserId(), invitee.getUserId(),
                    new AssistedBindingRequest("TIMO", timoId(invitee)), "test"); return true;
            } catch (Exception exception) { return false; }
        });
        var ownResult = CompletableFuture.supplyAsync(() -> {
            try { start.await(); lifecycle.submit(invitee.getUserId(), "TIMO", "488888888888"); return true;
            } catch (Exception exception) { return false; }
        });
        start.countDown();
        boolean assistedWon = assistedResult.get(15, java.util.concurrent.TimeUnit.SECONDS);
        boolean ownWon = ownResult.get(15, java.util.concurrent.TimeUnit.SECONDS);
        assertThat(assistedWon ^ ownWon).isTrue();
        assertThat(lifecycle.getBinding(invitee.getUserId(), "TIMO").getPlatformUserId())
                .isEqualTo(assistedWon ? timoId(invitee) : "488888888888");
    }

    @Test void validatesIdFormatBeforeSubmittingToEitherPlatform() throws Exception {
        var inviter = user(null);
        verifyTimo(inviter);
        var invitee = user(inviter);
        String token = sessions.issue(inviter.getUserId()).accessToken();
        submit(inviter, invitee, token, "TIMO", "12345678").andExpect(status().isBadRequest());
        submit(inviter, invitee, token, "LINKY", "400000000001").andExpect(status().isBadRequest());
    }

    @Test void frozenInviteesCannotBeBoundThroughTheAlternateEntry() throws Exception {
        var inviter = user(null);
        verifyTimo(inviter);
        var invitee = user(inviter);
        invitee.freezeAccount();
        users.save(invitee);
        assertThat(progress.get(inviter.getUserId(), "TIMO", 0, 20).items().getFirst().canBind()).isFalse();
        submit(inviter, invitee, sessions.issue(inviter.getUserId()).accessToken(), "TIMO", timoId(invitee))
                .andExpect(status().isForbidden());
    }

    @Test void simultaneousLinkySubmissionsKeepOneRegistrationAndOwner() throws Exception {
        var inviter = user(null);
        verifyLinky(inviter);
        var invitee = user(inviter);
        String assistedAccount = linkyId(invitee);
        String ownAccount = "88776655";
        mockAccount("LINKY", assistedAccount, "LINKY_DEFAULT_GUILD");
        mockAccount("LINKY", ownAccount, "LINKY_DEFAULT_GUILD");
        var start = new CountDownLatch(1);
        var assistedResult = CompletableFuture.supplyAsync(() -> {
            try { start.await(); assisted.submit(inviter.getUserId(), invitee.getUserId(),
                    new AssistedBindingRequest("LINKY", assistedAccount), "test"); return true;
            } catch (Exception exception) { return false; }
        });
        var ownResult = CompletableFuture.supplyAsync(() -> {
            try { start.await(); linky.registerForUser(invitee.getUserId(),
                    new RegisterLinkyAccountRequest("LINKY", ownAccount)); return true;
            } catch (Exception exception) { return false; }
        });
        start.countDown();
        boolean assistedWon = assistedResult.get(15, java.util.concurrent.TimeUnit.SECONDS);
        boolean ownWon = ownResult.get(15, java.util.concurrent.TimeUnit.SECONDS);
        assertThat(assistedWon ^ ownWon).isTrue();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM linky_account_binding WHERE user_id=?", Integer.class, invitee.getUserId())).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT linky_account FROM linky_account_binding WHERE user_id=?", String.class, invitee.getUserId()))
                .isEqualTo(assistedWon ? assistedAccount : ownAccount);
    }

    private org.springframework.test.web.servlet.ResultActions submit(UserDistributionProfile inviter,
            UserDistributionProfile invitee, String token, String platform, String account) throws Exception {
        return mvc.perform(post("/api/distribution/team/{inviter}/invitees/{invitee}/bindings", inviter.getUserId(), invitee.getUserId())
                .header("X-Distribution-Token", token).contentType(MediaType.APPLICATION_JSON)
                .content("{\"platformCode\":\"" + platform + "\",\"platformUserId\":\"" + account + "\"}"));
    }

    private UserDistributionProfile user(UserDistributionProfile inviter) {
        long id = IDS.incrementAndGet();
        var user = profiles.createProfile(id, "ID", "id", inviter == null ? null : inviter.getInviteCode());
        user.bindPhoneNumber("+62813" + id);
        return users.save(user);
    }

    private void verifyTimo(UserDistributionProfile user) {
        var binding = lifecycle.submit(user.getUserId(), "TIMO", timoId(user));
        lifecycle.verify(new VerifyPlatformBindingRequest("TIMO", timoId(user), false, true, "11003905",
                LocalDateTime.now().minusMinutes(1), "TEST", "test", binding.getId()));
    }

    private void verifyLinky(UserDistributionProfile user) {
        mockAccount("LINKY", linkyId(user), "LINKY_DEFAULT_GUILD");
        linky.registerForUser(user.getUserId(), new RegisterLinkyAccountRequest("LINKY", linkyId(user)));
    }

    private void mockAccount(String platform, String account, String guild) {
        mocks.save(PlatformVerificationMock.create(platform, account, false, true, guild,
                LocalDateTime.now().minusMinutes(1), "assisted-local-fixture", true));
    }

    private String timoId(UserDistributionProfile user) { return Long.toString(400000000000L + user.getUserId()); }
    private String linkyId(UserDistributionProfile user) { return String.format("%08d", user.getUserId()); }
}
