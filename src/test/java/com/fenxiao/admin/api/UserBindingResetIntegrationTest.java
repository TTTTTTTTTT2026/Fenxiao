package com.fenxiao.admin.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fenxiao.admin.entity.AdminAccount;
import com.fenxiao.admin.repository.AdminAccountRepository;
import com.fenxiao.distribution.api.dto.RegisterLinkyAccountRequest;
import com.fenxiao.distribution.entity.InviteBindingRegistration;
import com.fenxiao.distribution.service.ConsumerWorkspaceService;
import com.fenxiao.distribution.service.DistributionBindingService;
import com.fenxiao.distribution.service.InviteBindingRegistrationService;
import com.fenxiao.distribution.service.LinkyRegistrationEligibilityService;
import com.fenxiao.platform.domain.PlatformBindingStatus;
import com.fenxiao.platform.dto.VerifyPlatformBindingRequest;
import com.fenxiao.platform.repository.PlatformAccountBindingRepository;
import com.fenxiao.platform.service.PlatformLifecycleService;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.flywaydb.core.Flyway;
import org.h2.jdbcx.JdbcDataSource;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.time.LocalDateTime;
import java.util.Map;
import javax.sql.DataSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ActiveProfiles("test")
@SpringBootTest(properties = "test.binding-reset-isolation=true")
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class UserBindingResetIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;
    @Autowired AdminAccountRepository admins;
    @Autowired DistributionBindingService profiles;
    @Autowired UserDistributionProfileRepository users;
    @Autowired PlatformLifecycleService timo;
    @Autowired PlatformAccountBindingRepository timoBindings;
    @Autowired LinkyRegistrationEligibilityService linky;
    @Autowired InviteBindingRegistrationService registrations;
    @Autowired ConsumerWorkspaceService workspace;
    @Autowired DataSource database;

    @BeforeAll
    void addSqlOnlyTables() {
        var scripts = new ResourceDatabasePopulator();
        for (String migration : new String[]{
                "V34__add_mcn_income_shadow_ledger.sql", "V35__add_mcn_income_reward_candidate_shadow.sql",
                "V46__add_user_grade_governance.sql", "V49__add_token_point_conversion_governance.sql",
                "V52__add_effective_user_qualification_facts.sql", "V54__add_grade_advancement_review_records.sql",
                "V56__add_direct_invitee_point_facts.sql", "V66__add_invitation_reward_account.sql",
                "V73__add_consumer_workspace_preference.sql"
        }) scripts.addScript(new ClassPathResource("db/migration/" + migration));
        scripts.execute(database);
    }

    @Test
    void appliesV88OverTheExistingV87Schema() {
        var source = new JdbcDataSource();
        source.setURL("jdbc:h2:mem:reset-migration-" + java.util.UUID.randomUUID() + ";MODE=MySQL;DB_CLOSE_DELAY=-1");
        new ResourceDatabasePopulator(new ClassPathResource("db/migration/V87__add_timo_invitation_artwork.sql")).execute(source);
        var isolated = new JdbcTemplate(source);
        isolated.update("INSERT INTO timo_invitation_artwork VALUES ('id','image/png',?)", new byte[]{1});
        Flyway.configure().dataSource(source).baselineOnMigrate(true).baselineVersion("87").target("88").load().migrate();
        assertThat(isolated.queryForObject("SELECT COUNT(*) FROM timo_invitation_artwork", Integer.class)).isEqualTo(1);
        assertThat(isolated.queryForObject("SELECT COUNT(*) FROM platform_binding_reset_archive", Integer.class)).isZero();
    }

    @Test
    void rejectedTimoCanBeResetWithoutChangingLinkyOrBalance() throws Exception {
        long userId = 88101L;
        createUser(userId);
        bindLinky(userId, "88101001");
        String oldAccount = "881010000001";
        var original = timo.submit(userId, "TIMO", oldAccount);
        timo.verify(result(oldAccount, false, original.getId()));
        jdbc.update("INSERT INTO invitation_reward_account(user_id,frozen_points,available_points) VALUES (?,?,?)",
                userId, 12, 34);
        String token = login("reset_ops", "operations", "*", "*", "*");
        String revision = preview(userId, "TIMO", token).andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.maskedAccount").value("••••0001"))
                .andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        revision = json.readTree(revision).path("revision").asText();

        reset(userId, "TIMO", token, revision).andExpect(status().isNoContent());
        reset(userId, "TIMO", token, revision).andExpect(status().isConflict());
        assertThat(timoBindings.findByUserIdAndPlatformCode(userId, "TIMO")).isEmpty();
        assertThat(linky.getVerifiedBindingForUser(userId).getLinkyAccount()).isEqualTo("88101001");
        assertThat(jdbc.queryForObject("SELECT available_points FROM invitation_reward_account WHERE user_id=?", Integer.class, userId)).isEqualTo(34);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM platform_binding_history WHERE binding_id=?", Integer.class, original.getId())).isEqualTo(3);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM platform_binding_reset_archive WHERE user_id=?", Integer.class, userId)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM operation_audit_log WHERE target_id=? AND module_name='USER_PLATFORM_BINDING'",
                Integer.class, userId)).isEqualTo(1);

        String corrected = "881010000002";
        var replacement = timo.submit(userId, "TIMO", corrected);
        timo.verify(result(corrected, true, replacement.getId()));
        assertThat(workspace.get(userId).apps()).allMatch(ConsumerWorkspaceService.App::verified);

        createUser(88102L);
        var released = timo.submit(88102L, "TIMO", oldAccount);
        assertThatThrownBy(() -> timo.verify(result(oldAccount, true, original.getId())))
                .hasMessage("verification is for a previous binding");
        assertThatThrownBy(() -> timo.verify(result(oldAccount, true, null)))
                .hasMessage("verification is for a previous binding");
        assertThat(timo.getBinding(88102L, "TIMO").getBindingStatus()).isEqualTo(PlatformBindingStatus.SUBMITTED);
        assertThat(timo.verify(result(oldAccount, true, released.getId())).getBindingStatus()).isEqualTo(PlatformBindingStatus.VERIFIED);
    }

    @Test
    void linkyResetReleasesRegistrationAndPreservesTimoAndInvitationRelation() throws Exception {
        long userId = 88103L;
        createUser(userId);
        var old = bindLinky(userId, "88103001");
        var other = timo.submit(userId, "TIMO", "881030000001");
        String operator = login("reset_linky_ops", "operations", "*", "*", "*");
        preview(userId, "LINKY", operator).andExpect(jsonPath("$.blockedReason").value("曾通过核验的绑定需最高管理员复核。"));
        String supervisor = login("reset_linky_admin", "super_admin", "*", "*", "*");
        String revision = revision(userId, "LINKY", supervisor);
        reset(userId, "LINKY", operator, revision).andExpect(status().isConflict());
        reset(userId, "LINKY", supervisor, revision).andExpect(status().isNoContent());

        assertThat(workspace.get(userId).apps().get(1).verified()).isFalse();
        assertThat(timo.getBinding(userId, "TIMO").getId()).isEqualTo(other.getId());
        assertThat(jdbc.queryForObject("SELECT snapshot_data FROM platform_binding_reset_archive WHERE user_id=?",
                String.class, userId)).contains("88103001", "registration");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM invite_binding_registration WHERE id=?", Integer.class, old.getId())).isZero();
        assertThat(timoBindings.findResetBoundaries("LINKY", java.util.List.of("88103001")))
                .singleElement().satisfies(boundary -> assertThat(boundary.getResetAt()).isNotNull());
        assertThat(jdbc.queryForObject("SELECT ownership_status FROM user_product_ownership WHERE user_id=? AND product_code='LINKY'",
                String.class, userId)).isEqualTo("CORRECTED");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM distribution_relation WHERE user_id=?", Integer.class, userId)).isEqualTo(1);
        bindLinky(userId, "88103002");
        assertThat(linky.getVerifiedBindingForUser(userId).getLinkyAccount()).isEqualTo("88103002");
        assertThat(workspace.get(userId).apps().get(1).verified()).isTrue();
    }

    @Test
    void rejectsStalePreviewWrongScopeAndBindingWithDownstreamAward() throws Exception {
        long userId = 88104L;
        createUser(userId);
        String account = "881040000001";
        var original = timo.submit(userId, "TIMO", account);
        String supervisor = login("reset_scope_admin", "super_admin", "*", "*", "*");
        String revision = revision(userId, "TIMO", supervisor);
        timo.verify(result(account, true, original.getId()));
        reset(userId, "TIMO", supervisor, revision).andExpect(status().isConflict());
        String regional = login("reset_wrong_region", "operations", "TIMO", "*", "BR");
        preview(userId, "TIMO", regional).andExpect(status().isForbidden());
        String otherApp = login("reset_wrong_app", "operations", "LINKY", "*", "ID");
        preview(userId, "TIMO", otherApp).andExpect(status().isForbidden());
        String wrongGuild = login("reset_wrong_guild", "operations", "TIMO", "wrong-guild", "ID");
        preview(userId, "TIMO", wrongGuild).andExpect(status().isForbidden());
        String reader = login("reset_readonly", "operator", "*", "*", "*");
        preview(userId, "TIMO", reader).andExpect(status().isForbidden());

        jdbc.update("""
                INSERT INTO invitation_verification_campaign_award
                    (campaign_id, invited_user_id, inviter_user_id, platform_code, reward_points, verified_at)
                VALUES (10000, ?, 88001, 'TIMO', 25, CURRENT_TIMESTAMP)
                """, userId);
        preview(userId, "TIMO", supervisor).andExpect(jsonPath("$.blockedReason").value("此绑定已关联收益、资格、活动或下游公会归属，请人工复核。"));
        reset(userId, "TIMO", supervisor, revision(userId, "TIMO", supervisor)).andExpect(status().isConflict());
        assertThat(timo.getBinding(userId, "TIMO").getBindingStatus()).isEqualTo(PlatformBindingStatus.VERIFIED);
    }

    private void createUser(long id) {
        var user = profiles.createProfile(id, "ID", "id", null);
        user.bindPhoneNumber("+6280000" + id);
        users.save(user);
    }

    private InviteBindingRegistration bindLinky(long userId, String account) {
        linky.markEligible(account, "LINKY_DEFAULT_GUILD", "Linky Official Guild", 1L, "test verification");
        return registrations.registerForUser(userId, new RegisterLinkyAccountRequest("LINKY", account));
    }

    private VerifyPlatformBindingRequest result(String account, boolean found, Long bindingId) {
        return new VerifyPlatformBindingRequest("TIMO", account, false, found, "test-guild", LocalDateTime.now(),
                "MCN_TIMO", "test-evidence", bindingId);
    }

    private String login(String name, String role, String platform, String guild, String region) throws Exception {
        String password = "local-only-binding-test";
        var admin = AdminAccount.create(name, name, role, "{plain}" + password, true);
        admin.updateProfile(name, role, platform, guild, region);
        admins.save(admin);
        return json.readTree(mvc.perform(post("/admin/auth/session").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("username", name, "password", password))))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).path("sessionToken").asText();
    }

    private String revision(long userId, String platform, String token) throws Exception {
        return json.readTree(preview(userId, platform, token).andReturn().getResponse().getContentAsString()).path("revision").asText();
    }

    private ResultActions preview(long userId, String platform, String token) throws Exception {
        return mvc.perform(get("/admin/distribution/user-platform-profiles/{userId}/binding-reset/{platform}", userId, platform)
                .header("X-Admin-Session", token));
    }

    private ResultActions reset(long userId, String platform, String token, String revision) throws Exception {
        return mvc.perform(post("/admin/distribution/user-platform-profiles/{userId}/binding-reset/{platform}", userId, platform)
                .header("X-Admin-Session", token).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("revision", revision, "reason", "test correction"))));
    }
}
