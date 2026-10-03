package com.fenxiao.distribution.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.http.MediaType;
import com.fenxiao.income.mcn.service.InvitationRewardAccountQueryService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import javax.sql.DataSource;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class ConsumerWorkspaceServiceTest {
    @Autowired ConsumerWorkspaceService workspaces;
    @Autowired DistributionBindingService profiles;
    @Autowired DistributionFrontendService dashboard;
    @Autowired InvitationRewardAccountQueryService accounts;
    @Autowired JdbcTemplate jdbc;
    @Autowired DataSource dataSource;
    @Autowired MockMvc mockMvc;

    @BeforeAll
    void createWorkspaceTable() {
        new ResourceDatabasePopulator(
                new ClassPathResource("db/migration/V49__add_token_point_conversion_governance.sql"),
                new ClassPathResource("db/migration/V52__add_effective_user_qualification_facts.sql"),
                new ClassPathResource("db/migration/V66__add_invitation_reward_account.sql"),
                new ClassPathResource("db/migration/V73__add_consumer_workspace_preference.sql"))
                .execute(dataSource);
    }

    @Test
    void onlyVerifiedAppsCanBeSelectedAndPreferenceSurvivesUntilBindingIsLost() {
        long userId = 997001L;
        profiles.createProfile(userId, "BR", "pt-br", null);
        assertNull(workspaces.get(userId).selected());
        assertThrows(IllegalArgumentException.class, () -> workspaces.select(userId, "TIMO"));
        assertThrows(IllegalArgumentException.class, () -> workspaces.select(userId, "OTHER"));

        LocalDateTime first = LocalDateTime.of(2026, 9, 1, 12, 0);
        jdbc.update("""
                INSERT INTO linky_account_binding(user_id,linky_account,guild_check_status,registration_eligibility,checked_at,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?)
                """, userId, "40689459", "MATCHED_OURS", "ELIGIBLE", first, first, first);
        jdbc.update("""
                INSERT INTO platform_account_binding(user_id,platform_code,platform_user_id,binding_status,submitted_at,verified_at,version_no,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?)
                """, userId, "TIMO", "183082848282", "VERIFIED", first.plusDays(1), first.plusDays(1), 1, first, first);

        assertEquals("LINKY", workspaces.get(userId).selected());
        assertEquals("TIMO", workspaces.select(userId, "TIMO").selected());
        assertEquals("TIMO", workspaces.get(userId).preferred());
        jdbc.update("UPDATE platform_account_binding SET binding_status='REJECTED' WHERE user_id=?", userId);
        assertEquals("LINKY", workspaces.get(userId).selected());
        assertThrows(IllegalArgumentException.class, () -> workspaces.requireVerified(userId, "TIMO"));
    }

    @Test
    void applicationScopedTeamExcludesMembersOfOtherApplications() {
        var leader = profiles.createProfile(997010L, "BR", "pt-br", null);
        profiles.createProfile(997011L, "BR", "pt-br", leader.getInviteCode());
        profiles.createProfile(997012L, "BR", "pt-br", leader.getInviteCode());
        LocalDateTime now = LocalDateTime.of(2026, 9, 2, 12, 0);
        jdbc.update("""
                INSERT INTO platform_account_binding(user_id,platform_code,platform_user_id,binding_status,submitted_at,verified_at,version_no,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?)
                """, 997011L, "TIMO", "183082848283", "VERIFIED", now, now, 1, now, now);
        jdbc.update("""
                INSERT INTO linky_account_binding(user_id,linky_account,guild_check_status,registration_eligibility,checked_at,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?)
                """, 997012L, "40689460", "MATCHED_OURS", "ELIGIBLE", now, now, now);
        for (String platform : new String[]{"TIMO", "LINKY"}) {
            long child = platform.equals("TIMO") ? 997011L : 997012L;
            jdbc.update("""
                    INSERT INTO effective_user_qualification_fact(user_id,platform_code,qualification_status,evaluated_at)
                    VALUES (?,?,?,?)
                    """, child, platform, "QUALIFIED", now);
        }
        assertEquals(1, dashboard.getHome(leader.getUserId(), "TIMO").directInvitedUsers());
        assertEquals(1, dashboard.getHome(leader.getUserId(), "LINKY").directInvitedUsers());
        assertEquals(997011L, dashboard.getEffectiveTeam(leader.getUserId(), "TIMO").items().getFirst().userId());
        assertEquals(997012L, dashboard.getEffectiveTeam(leader.getUserId(), "LINKY").items().getFirst().userId());
    }

    @Test
    void scopedRewardViewNeverMixesTimoAndLinkyLedgerRows() {
        long userId = 997020L;
        profiles.createProfile(userId, "BR", "pt-br", null);
        LocalDateTime now = LocalDateTime.of(2026, 9, 3, 12, 0);
        jdbc.update("""
                INSERT INTO token_point_conversion_version(conversion_code,conversion_version,platform_code,token_unit,points_per_token,effective_from)
                VALUES ('test-timo-conversion',1,'TIMO','DIAMOND',1,?)
                """, now);
        long conversionId = jdbc.queryForObject("SELECT id FROM token_point_conversion_version WHERE conversion_code='test-timo-conversion'", Long.class);
        for (String platform : new String[]{"TIMO", "LINKY"}) {
            String source = "workspace-" + platform.toLowerCase();
            jdbc.update("""
                    INSERT INTO invitation_reward_entry(user_id,platform_code,source_event_id,reward_level,source_revision,business_date,occurred_at,
                        source_user_id,source_guild_id,raw_diamonds,company_share_rate,company_income_diamonds,invitation_rate,
                        reward_diamonds,conversion_id,points_per_diamond,reward_points,recorded_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                    """, userId, platform, source, 1, "v1", java.sql.Date.valueOf("2026-09-03"), now,
                    997021L, "guild", BigDecimal.TEN, BigDecimal.ONE, BigDecimal.TEN, BigDecimal.ONE,
                    BigDecimal.TEN, conversionId, BigDecimal.ONE, BigDecimal.TEN, now);
            long entryId = jdbc.queryForObject("SELECT id FROM invitation_reward_entry WHERE source_event_id=?", Long.class, source);
            jdbc.update("""
                    INSERT INTO invitation_reward_account_ledger(user_id,entry_id,event_type,frozen_delta,available_delta,reason,
                        platform_code,source_event_id,source_revision,reward_level,source_user_id,raw_diamonds,company_share_rate,
                        company_income_diamonds,invitation_rate,reward_diamonds,points_per_diamond,conversion_id,created_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                    """, userId, entryId, "CREDIT", BigDecimal.TEN, BigDecimal.ZERO, "test", platform, source, "v1", 1,
                    997021L, BigDecimal.TEN, BigDecimal.ONE, BigDecimal.TEN, BigDecimal.ONE, BigDecimal.TEN,
                    BigDecimal.ONE, conversionId, now);
        }
        var timo = accounts.get(userId, 0, 20, "TIMO");
        assertEquals(1, timo.totalRecords());
        assertEquals("TIMO", timo.items().getFirst().platformCode());
        assertEquals(0, timo.frozenPoints().compareTo(BigDecimal.TEN));
        assertEquals(2, accounts.get(userId, 0, 20).totalRecords());
    }

    @Test
    void workspaceEndpointRequiresOwnerSessionAndVerifiedBinding() throws Exception {
        var owner = profiles.createProfile(997030L, "BR", "pt-br", null);
        var other = profiles.createProfile(997031L, "BR", "pt-br", null);
        mockMvc.perform(get("/api/distribution/workspaces/997030")
                .header("X-Distribution-Token", other.getApiAccessToken()))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/distribution/workspaces/997030")
                .header("X-Distribution-Token", owner.getApiAccessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"platformCode\":\"TIMO\"}"))
                .andExpect(status().isBadRequest());
        LocalDateTime now = LocalDateTime.of(2026, 9, 4, 12, 0);
        jdbc.update("""
                INSERT INTO platform_account_binding(user_id,platform_code,platform_user_id,binding_status,submitted_at,verified_at,version_no,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?)
                """, owner.getUserId(), "TIMO", "183082848284", "VERIFIED", now, now, 1, now, now);
        mockMvc.perform(post("/api/distribution/workspaces/997030")
                .header("X-Distribution-Token", owner.getApiAccessToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"platformCode\":\"TIMO\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.selected").value("TIMO"));
    }
}
