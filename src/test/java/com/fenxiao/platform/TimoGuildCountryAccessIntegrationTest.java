package com.fenxiao.platform;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fenxiao.admin.entity.AdminAccount;
import com.fenxiao.admin.repository.AdminAccountRepository;
import com.fenxiao.admin.service.AdminPasswordHasher;
import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.distribution.service.DistributionBindingService;
import com.fenxiao.platform.domain.PlatformBindingStatus;
import com.fenxiao.platform.dto.UpdateTimoGuildCountriesRequest;
import com.fenxiao.platform.entity.McnGuildDirectoryItem;
import com.fenxiao.platform.entity.PlatformGuildDirectory;
import com.fenxiao.platform.mcn.McnTimoBatchResponse;
import com.fenxiao.platform.mcn.McnTimoVerificationClient;
import com.fenxiao.platform.repository.*;
import com.fenxiao.platform.service.*;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ActiveProfiles("test")
@AutoConfigureMockMvc
@SpringBootTest(properties = "app.platform-verification.source=MCN")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class TimoGuildCountryAccessIntegrationTest {
    private static final String MX = "22000408", BR = "22000448";
    private static final AtomicLong IDS = new AtomicLong(7980000);
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired PlatformGuildDirectoryRepository directory;
    @Autowired TimoGuildCountryPolicyRepository policies;
    @Autowired TimoGuildCountryAccessService access;
    @Autowired McnTimoGuildScopeResolver scopes;
    @Autowired DistributionBindingService users;
    @Autowired UserDistributionProfileRepository profiles;
    @Autowired PlatformLifecycleService lifecycle;
    @Autowired PlatformBindingVerificationService verification;
    @Autowired PlatformVerificationAttemptRepository attempts;
    @Autowired AdminAccountRepository admins;
    @Autowired AdminPasswordHasher hasher;
    @Autowired AdminSessionService sessions;
    @Autowired JdbcTemplate jdbc;
    @MockBean McnTimoVerificationClient mcn;

    @BeforeEach void setup() {
        policies.deleteAll();
        seen(MX, "Mexico", "ACTIVE"); seen(BR, "Brazil", "ACTIVE");
    }

    @ParameterizedTest @ValueSource(strings = {"CO", "CL", "VE", "PE"})
    void fourUserCountriesUseTheOneMexicoGuildWithoutChangingTheirCountry(String country) throws Exception {
        String token = token("super_admin");
        save(token, MX, 0, List.of("MX", "CO", "CL", "VE", "PE"));
        assertThat(access.acceptedCountriesByGuild().get(MX)).containsExactly("CL", "CO", "MX", "PE", "VE");
        long id = IDS.incrementAndGet();
        users.createProfile(id, country, "es-mx", null);
        String timoId = "90000" + String.format("%07d", id);
        lifecycle.submit(id, "TIMO", timoId);
        when(mcn.query(timoId, MX, "Mexico")).thenReturn(new McnTimoBatchResponse(true, "3", "test-country-request", "TIMO", null, List.of(
                new McnTimoBatchResponse.Result("TIMO", timoId, "found",
                        new McnTimoBatchResponse.GuildScope(MX, "test-mx", "Latam", "Mexico"), "CURRENT_ROSTER",
                        "2026-10-21 10:00:00", null, "test-generation", "test-checksum", null))));
        var result = verification.verifySubmittedBinding(id, "TIMO");
        assertThat(result.getBindingStatus()).isEqualTo(PlatformBindingStatus.VERIFIED);
        assertThat(result.getOfficialGuildId()).isEqualTo(MX);
        assertThat(profiles.findById(id).orElseThrow().getCountryCode()).isEqualTo(country);
        assertThat(directory.findByPlatformCodeAndExternalGuildId("TIMO", MX).orElseThrow().getCountry()).isEqualTo("Mexico");
        verify(mcn).query(timoId, MX, "Mexico");

        // Narrowing future eligibility must not revoke already-verified bindings or rewrite accounts.
        save(token, MX, 1, List.of());
        assertThat(lifecycle.getBinding(id, "TIMO").getBindingStatus()).isEqualTo(PlatformBindingStatus.VERIFIED);
        assertThat(profiles.findById(id).orElseThrow().getCountryCode()).isEqualTo(country);
        assertThatThrownBy(() -> scopes.resolve("TIMO", country)).hasMessageContaining("no enabled Timo target guild");
        assertThatThrownBy(() -> scopes.resolve("TIMO", "MX")).hasMessageContaining("no enabled Timo target guild");
        assertThat(jdbc.queryForObject("select count(*) from operation_audit_log where module_name='TIMO_GUILD_COUNTRY_ACCESS' and target_id=?",
                Integer.class, directory.findByPlatformCodeAndExternalGuildId("TIMO", MX).orElseThrow().getId())).isGreaterThanOrEqualTo(2);
    }

    @Test void inheritsOldScopesButNeverInfersAnUnconfiguredCountry() {
        assertThat(scopes.resolve("TIMO", "MX").mcnCountry()).isEqualTo("Mexico");
        assertThat(scopes.resolve("TIMO", "BR").mcnCountry()).isEqualTo("Brazil");
        assertThat(scopes.resolve("TIMO", "ID").mcnCountry()).isEqualTo("Indonesia");
        assertThatThrownBy(() -> scopes.resolve("TIMO", "CO")).hasMessageContaining("no enabled Timo target guild");
        assertThat(access.summary(MX).countryCodes()).containsExactly("MX");
        assertThat(access.summary(MX).managed()).isFalse();
        verifyNoInteractions(mcn);
    }

    @Test void onlySuperAdminCanWriteAndOldTokensCannotBypassTheSession() throws Exception {
        for (String role : List.of("finance", "admin", "operations")) {
            String token = token(role);
            mvc.perform(get(path(MX)).header("X-Admin-Session", token)).andExpect(status().isOk());
            mvc.perform(put(path(MX)).header("X-Admin-Session", token).contentType(MediaType.APPLICATION_JSON)
                    .content(body(0, List.of("MX", "CO"))))
                    .andExpect(status().isForbidden());
        }
        mvc.perform(put(path(MX)).header("X-Admin-Token", "test-admin-token").contentType(MediaType.APPLICATION_JSON)
                .content(body(0, List.of("MX", "CO")))).andExpect(status().isForbidden());
        assertThat(policies.count()).isZero();
        String root = token("super_admin");
        mvc.perform(get(path(MX).replace("/TIMO/", "/LINKY/")).header("X-Admin-Session", root)).andExpect(status().isBadRequest());
        mvc.perform(put(path(MX)).header("X-Admin-Session", root).contentType(MediaType.APPLICATION_JSON)
                .content(body(0, List.of("ZZ")))).andExpect(status().isBadRequest());
        mvc.perform(put(path(MX)).header("X-Admin-Session", root).contentType(MediaType.APPLICATION_JSON)
                .content(body(0, List.of("CO", "co")))).andExpect(status().isBadRequest());
    }

    @Test void versionsAndCountryOwnershipConflictsAreExplicitAndDoNotPartiallySave() throws Exception {
        String root = token("super_admin");
        save(root, MX, 0, List.of("MX", "CO"));
        mvc.perform(put(path(MX)).header("X-Admin-Session", root).contentType(MediaType.APPLICATION_JSON).content(body(0, List.of("VE"))))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.message").value("接纳国家配置已变化，请重新打开后再保存"));
        mvc.perform(put(path(BR)).header("X-Admin-Session", root).contentType(MediaType.APPLICATION_JSON).content(body(0, List.of("BR", "CO"))))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("已有目标公会")));
        assertThat(access.summary(BR).managed()).isFalse();
        assertThat(access.summary(MX).countryCodes()).containsExactly("CO", "MX");
        save(root, MX, 1, List.of("MX"));
        save(root, BR, 0, List.of("BR", "CO"));
        assertThat(scopes.resolve("TIMO", "CO").mcnCountry()).isEqualTo("Brazil");
    }

    @Test void mcnSyncDoesNotOverwriteAcceptanceAndInactiveOrMissingCountriesFailClosed() throws Exception {
        String root = token("super_admin");
        save(root, MX, 0, List.of("MX", "VE"));
        seen(MX, "Mexico", "ACTIVE");
        assertThat(access.summary(MX).countryCodes()).containsExactly("MX", "VE");
        seen(MX, null, "ACTIVE");
        assertThatThrownBy(() -> scopes.resolve("TIMO", "VE")).hasMessageContaining("country is missing");
        mvc.perform(put(path(MX)).header("X-Admin-Session", root).contentType(MediaType.APPLICATION_JSON).content(body(1, List.of("MX"))))
                .andExpect(status().isBadRequest());
        seen(MX, "Mexico", "DISABLED");
        assertThatThrownBy(() -> scopes.resolve("TIMO", "VE")).hasMessageContaining("未处于正常启用状态");
        assertThat(access.summary(MX).version()).isEqualTo(1);
    }

    @Test void wrongGuildEvidenceIsStillRejectedAfterOpeningCountries() throws Exception {
        save(token("super_admin"), MX, 0, List.of("MX", "CO"));
        long id = IDS.incrementAndGet();
        users.createProfile(id, "CO", "es-mx", null);
        String timo = "90000" + String.format("%07d", id);
        lifecycle.submit(id, "TIMO", timo);
        when(mcn.query(timo, MX, "Mexico")).thenReturn(new McnTimoBatchResponse(true, "3", "wrong-guild-test", "TIMO", null, List.of(
                new McnTimoBatchResponse.Result("TIMO", timo, "found",
                        new McnTimoBatchResponse.GuildScope(BR, "test-br", "Another guild", "Brazil"), "CURRENT_ROSTER",
                        "2026-10-21 10:00:00", null, "test-generation", "test-checksum", null))));
        var result = verification.verifySubmittedBinding(id, "TIMO");
        assertThat(result.getBindingStatus()).isEqualTo(PlatformBindingStatus.REJECTED);
        assertThat(result.getRejectionCode()).isEqualTo("expected_guild_mismatch");
        assertThat(profiles.findById(id).orElseThrow().getCountryCode()).isEqualTo("CO");
    }

    @Test void limitedRootCannotModifyCountriesOutsideItsOwnScope() {
        var actor = new AdminSessionService.AdminPrincipal(0, "scoped-test", "Scoped test", "super_admin", false, 0,
                false, LocalDateTime.now().plusHours(1), "TIMO", MX, "MX");
        assertThatThrownBy(() -> access.save("TIMO", MX, new UpdateTimoGuildCountriesRequest(0, List.of("MX", "CO")), actor, "127.0.0.1"))
                .isInstanceOf(com.fenxiao.common.api.ForbiddenException.class);
        assertThat(policies.count()).isZero();
    }

    @Test void concurrentFirstSavesCannotGiveOneCountryToTwoGuilds() throws Exception {
        var actor = sessions.assertSession(token("super_admin"));
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            List<Future<Boolean>> results = List.of(pool.submit(() -> attemptSave(actor, MX, start)), pool.submit(() -> attemptSave(actor, BR, start)));
            start.countDown();
            int successes = 0;
            for (Future<Boolean> result : results) if (result.get(15, TimeUnit.SECONDS)) successes++;
            assertThat(successes).isEqualTo(1);
            assertThat(policies.findForCountry("CO")).isPresent();
        } finally { pool.shutdownNow(); }
    }

    private boolean attemptSave(AdminSessionService.AdminPrincipal actor, String guild, CountDownLatch start) throws Exception {
        start.await();
        try { access.save("TIMO", guild, new UpdateTimoGuildCountriesRequest(0, List.of("CO")), actor, "127.0.0.1"); return true; }
        catch (ResponseStatusException conflict) { assertThat(conflict.getStatusCode().value()).isEqualTo(409); return false; }
    }
    private void seen(String guild, String country, String status) {
        var item = new McnGuildDirectoryItem(guild, "Test guild", status, country, null, null, "test-version", null);
        var value = directory.findByPlatformCodeAndExternalGuildId("TIMO", guild)
                .orElseGet(() -> PlatformGuildDirectory.seen("TIMO", item, "country-test-run", LocalDateTime.now()));
        value.apply(item, "country-test-run", LocalDateTime.now()); directory.save(value);
    }
    private void save(String token, String guild, int version, List<String> countries) throws Exception {
        mvc.perform(put(path(guild)).header("X-Admin-Session", token).contentType(MediaType.APPLICATION_JSON).content(body(version, countries)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.version").value(version + 1));
    }
    private String body(int version, List<String> countries) throws Exception { return json.writeValueAsString(Map.of("expectedVersion", version, "countryCodes", countries)); }
    private String path(String guild) { return "/admin/platform-integrations/TIMO/guilds/" + guild + "/accepted-countries"; }
    private String token(String role) {
        String name = "country_" + role + "_" + IDS.incrementAndGet(), password = "Country-Test-Password-2026!";
        admins.save(AdminAccount.create(name, name, role, hasher.hash(password), true));
        return sessions.createSession(name, password, false, "country-test-" + IDS.get(), "JUnit").sessionToken();
    }
}
