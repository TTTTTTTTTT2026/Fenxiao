package com.fenxiao.distribution.service;

import com.fenxiao.admin.entity.AdminAccount;
import com.fenxiao.admin.repository.AdminAccountRepository;
import com.fenxiao.admin.service.AdminPasswordHasher;
import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.distribution.repository.UserEarningsReadAccessRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;
import javax.sql.DataSource;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ActiveProfiles("test")
@SpringBootTest(properties="spring.datasource.url=jdbc:h2:mem:earnings_access_${random.uuid};MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class UserEarningsReadAccessIntegrationTest {
    private static final AtomicLong IDS = new AtomicLong(7960000);
    @Autowired MockMvc mvc;
    @Autowired DistributionBindingService profiles;
    @Autowired ConsumerWorkspaceService workspaces;
    @Autowired UserEarningsReadAccessService grants;
    @Autowired UserEarningsReadAccessRepository entries;
    @Autowired AdminAccountRepository admins;
    @Autowired AdminPasswordHasher hasher;
    @Autowired AdminSessionService sessions;
    @Autowired JdbcTemplate jdbc;
    @Autowired DataSource dataSource;
    @BeforeAll void schema() { new ResourceDatabasePopulator(new ClassPathResource("schema-local.sql")).execute(dataSource); }

    @Test void grantEnablesZeroBalanceReadWithoutBindingOrGradeEligibilityAndCanBeRevoked() throws Exception {
        var user = profiles.createProfile(IDS.incrementAndGet(), "BR", "pt-br", null);
        long id = user.getUserId(); String token = user.getApiAccessToken(); String root = admin("super_admin", "*");
        assertThat(workspaces.get(id).selected()).isNull();
        account(id, token, "TIMO", 400);
        change(root, id, "TIMO", true, 0, 200);
        assertThat(workspaces.get(id).selected()).isEqualTo("TIMO");
        assertThat(workspaces.get(id).apps().getFirst().verified()).isFalse();
        assertThat(workspaces.get(id).apps().getFirst().earningsReadable()).isTrue();
        mvc.perform(get("/api/distribution/workspaces/" + id).header("X-Distribution-Token", token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.apps[0].verified").value(false))
                .andExpect(jsonPath("$.apps[0].earningsReadable").value(true));
        mvc.perform(get("/api/distribution/accounts/" + id).param("platformCode", "TIMO").header("X-Distribution-Token", token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalPoints").value(0)).andExpect(jsonPath("$.withdrawalEnabled").value(false));
        for (String url : List.of("/api/distribution/home/", "/api/distribution/team/")) {
            mvc.perform(get(url + id + (url.contains("team") ? "/effective" : "")).param("platformCode", "TIMO")
                    .header("X-Distribution-Token", token)).andExpect(status().isOk());
        }
        mvc.perform(get("/api/distribution/grade-progress/" + id).param("platformCode", "TIMO").header("X-Distribution-Token", token))
                .andExpect(status().isBadRequest());
        assertThatThrownBy(() -> workspaces.requireVerified(id, "TIMO")).isInstanceOf(IllegalArgumentException.class);
        assertThat(jdbc.queryForObject("select count(*) from platform_account_binding where user_id=?", Integer.class, id)).isZero();
        assertThat(jdbc.queryForObject("select count(*) from invitation_reward_account_ledger where user_id=?", Integer.class, id)).isZero();
        assertThat(jdbc.queryForObject("select count(*) from invitation_reward_account where user_id=?", Integer.class, id)).isZero();
        account(id, token, "LINKY", 400);
        change(root, id, "TIMO", false, 1, 200);
        assertThat(workspaces.get(id).selected()).isNull();
        account(id, token, "TIMO", 400);
        assertThat(jdbc.queryForObject("select count(*) from operation_audit_log where module_name='USER_EARNINGS_READ_ACCESS' and target_id=?", Integer.class, id)).isEqualTo(2);
    }

    @Test void accountAndReportRemainAppScopedAndOnlyOwnerMayRead() throws Exception {
        var user = profiles.createProfile(IDS.incrementAndGet(), "BR", "pt-br", null);
        var other = profiles.createProfile(IDS.incrementAndGet(), "BR", "pt-br", null);
        long id=user.getUserId(); String root=admin("super_admin", "*");
        change(root, id, "TIMO", true, 0, 200); change(root, id, "LINKY", true, 0, 200);
        // Account/ledger synthetic evidence: existing revenue must remain unchanged by grants/revocations.
        jdbc.update("insert into invitation_reward_account_ledger(user_id,entry_id,event_type,frozen_delta,available_delta,reason,platform_code,source_event_id,source_revision,reward_level,source_user_id,raw_diamonds,company_share_rate,company_income_diamonds,invitation_rate,reward_diamonds,points_per_diamond,conversion_id,created_at) values(?,1,'CREDIT',0,17,'test','TIMO','read-test-timo','v1',1,?,17,1,17,1,17,1,1,CURRENT_TIMESTAMP)",id,other.getUserId());
        jdbc.update("insert into invitation_reward_account_ledger(user_id,entry_id,event_type,frozen_delta,available_delta,reason,platform_code,source_event_id,source_revision,reward_level,source_user_id,raw_diamonds,company_share_rate,company_income_diamonds,invitation_rate,reward_diamonds,points_per_diamond,conversion_id,created_at) values(?,1,'CREDIT',0,29,'test','LINKY','read-test-linky','v1',1,?,29,1,29,1,29,1,1,CURRENT_TIMESTAMP)",id,other.getUserId());
        LocalDate date=LocalDate.now(ZoneOffset.UTC).minusDays(1);
        jdbc.update("insert into invitation_commission_report_daily values(?,'TIMO',?,?,?,1,17)",id,date,other.getUserId(),other.getUserId());
        jdbc.update("insert into invitation_commission_report_daily values(?,'LINKY',?,?,?,1,29)",id,date,other.getUserId(),other.getUserId());
        workspaces.select(id,"TIMO");
        mvc.perform(get("/api/distribution/accounts/"+id).param("platformCode","TIMO").header("X-Distribution-Token",user.getApiAccessToken()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.availablePoints").value(17)).andExpect(jsonPath("$.totalRecords").value(1));
        String url="/api/distribution/commission-reports/"+id;
        mvc.perform(get(url).param("platformCode","TIMO").param("startDate",date.toString()).param("endDate",date.toString()).header("X-Distribution-Token",user.getApiAccessToken()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalPoints").value(17));
        mvc.perform(get(url).param("platformCode","LINKY").param("startDate",date.toString()).param("endDate",date.toString()).header("X-Distribution-Token",user.getApiAccessToken()))
                .andExpect(status().isBadRequest());
        account(id,other.getApiAccessToken(),"TIMO",403);
        workspaces.select(id,"LINKY");
        mvc.perform(get(url).param("platformCode","LINKY").param("startDate",date.toString()).param("endDate",date.toString()).header("X-Distribution-Token",user.getApiAccessToken()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalPoints").value(29));
        jdbc.update("insert into invitation_commission_report_daily values(?,'LINKY',?,?,?,2,4)",id,date,other.getUserId(),id+900000);
        jdbc.update("insert into invitation_commission_report_daily values(?,'TIMO',?,?,?,2,9)",id,date,other.getUserId(),id+900000);
        mvc.perform(get(url+"/invitees/"+other.getUserId()).param("platformCode","LINKY").param("startDate",date.toString()).param("endDate",date.toString())
                .header("X-Distribution-Token",user.getApiAccessToken())).andExpect(status().isOk())
                .andExpect(jsonPath("$.indirectPoints").value(4)).andExpect(jsonPath("$.items[0].points").value(4));
        change(root,id,"LINKY",false,1,200);
        assertThat(workspaces.get(id).selected()).isEqualTo("TIMO");
        assertThat(jdbc.queryForObject("select sum(available_delta) from invitation_reward_account_ledger where user_id=?",Integer.class,id)).isEqualTo(46);
    }

    @Test void grantDoesNotUnlockOtherAppAndWorkspaceSwitchCanRememberAuthorizedApp() throws Exception {
        var user=profiles.createProfile(IDS.incrementAndGet(),"BR","pt-br",null); long id=user.getUserId();
        change(admin("super_admin","*"),id,"LINKY",true,0,200);
        assertThat(workspaces.get(id).selected()).isEqualTo("LINKY");
        assertThatThrownBy(()->workspaces.select(id,"TIMO")).isInstanceOf(IllegalArgumentException.class);
        assertThat(workspaces.select(id,"LINKY").preferred()).isEqualTo("LINKY");
        account(id,user.getApiAccessToken(),"TIMO",400);
        account(id,user.getApiAccessToken(),"LINKY",200);
    }

    @Test void onlyGlobalSuperAdminMayManageAndSessionIsRequired() throws Exception {
        long id=profiles.createProfile(IDS.incrementAndGet(),"BR","pt-br",null).getUserId();
        for(String role:List.of("admin","operations","finance")) change(admin(role,"*"),id,"TIMO",true,0,403);
        change(admin("super_admin","BR"),id,"TIMO",true,0,403);
        mvc.perform(put(path(id)+"/TIMO").header("X-Admin-Token","test-admin-token").contentType(MediaType.APPLICATION_JSON)
                .content("{\"enabled\":true,\"expectedVersion\":0,\"reason\":\"test\"}")).andExpect(status().isForbidden());
        assertThat(grants.grantedPlatforms(id)).isEmpty();
    }

    @Test void staleVersionAndInvalidRequestsNeverOverwritePermission() throws Exception {
        long id=profiles.createProfile(IDS.incrementAndGet(),"BR","pt-br",null).getUserId();String root=admin("super_admin","*");
        change(root,id,"TIMO",true,0,200);change(root,id,"TIMO",false,0,409);
        change(root,id,"OTHER",true,0,400);
        mvc.perform(put(path(id)+"/TIMO").header("X-Admin-Session",root).contentType(MediaType.APPLICATION_JSON)
                .content("{\"enabled\":false,\"expectedVersion\":1,\"reason\":\"  \"}")).andExpect(status().isBadRequest());
        mvc.perform(put(path(id)+"/TIMO").header("X-Admin-Session",root).contentType(MediaType.APPLICATION_JSON)
                .content("{\"expectedVersion\":1,\"reason\":\"test\"}")).andExpect(status().isBadRequest());
        assertThat(grants.grantedPlatforms(id)).containsExactly("TIMO");
    }

    @Test void concurrentFirstGrantHasOneWinner() throws Exception {
        long id=profiles.createProfile(IDS.incrementAndGet(),"BR","pt-br",null).getUserId();
        var root=sessions.assertSession(admin("super_admin","*")); var latch=new CountDownLatch(1);
        var pool=Executors.newFixedThreadPool(2);
        try {
            Callable<Boolean> task=()->{latch.await();try{grants.change(id,"TIMO",true,0,"concurrent test",root,"127.0.0.1");return true;}
                catch(ResponseStatusException conflict){assertThat(conflict.getStatusCode().value()).isEqualTo(409);return false;}};
            var one=pool.submit(task);var two=pool.submit(task);latch.countDown();
            assertThat(List.of(one.get(15,TimeUnit.SECONDS),two.get(15,TimeUnit.SECONDS))).containsExactlyInAnyOrder(true,false);
            assertThat(entries.findByUserId(id)).hasSize(1);
        } finally {pool.shutdownNow();}
    }

    @Test void verifiedUserKeepsBindingAccessAfterExplicitGrantIsRevoked() throws Exception {
        var user=profiles.createProfile(IDS.incrementAndGet(),"BR","pt-br",null);long id=user.getUserId();String root=admin("super_admin","*");
        jdbc.update("insert into platform_account_binding(user_id,platform_code,platform_user_id,binding_status,submitted_at,verified_at,version_no,created_at,updated_at) values(?,'TIMO',?,'VERIFIED',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)",id,"90"+id+"000");
        change(root,id,"TIMO",true,0,200);change(root,id,"TIMO",false,1,200);
        assertThat(workspaces.get(id).selected()).isEqualTo("TIMO");
        assertThat(workspaces.requireVerified(id,"TIMO")).isEqualTo("TIMO");
        assertThat(workspaces.get(id).apps().getFirst().earningsAccessGranted()).isFalse();
        account(id,user.getApiAccessToken(),"TIMO",200);
    }

    @Test void administratorListDisplaysSavedGrantsAndDefaultSelectionNeverCombinesApps() throws Exception {
        var user=profiles.createProfile(IDS.incrementAndGet(),"BR","pt-br",null);long id=user.getUserId();String root=admin("super_admin","*");
        change(root,id,"TIMO",true,0,200);change(root,id,"LINKY",true,0,200);
        assertThat(workspaces.get(id).selected()).isEqualTo("TIMO");
        assertThat(workspaces.select(id,"LINKY").selected()).isEqualTo("LINKY");
        assertThat(workspaces.get(id).selected()).isEqualTo("LINKY");
        mvc.perform(get("/admin/distribution/user-platform-profiles").param("userId",String.valueOf(id)).header("X-Admin-Session",root))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items[0].earningsReadPlatforms[0]").value("LINKY"))
                .andExpect(jsonPath("$.items[0].earningsReadPlatforms[1]").value("TIMO"));
        mvc.perform(get(path(id)).header("X-Admin-Session",root)).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].platformCode").value("TIMO")).andExpect(jsonPath("$[0].enabled").value(true));
    }

    @Test void revokedAppReportsAndOutsiderDrilldownAreNotReadable() throws Exception {
        var user=profiles.createProfile(IDS.incrementAndGet(),"BR","pt-br",null);long id=user.getUserId();
        var stranger=profiles.createProfile(IDS.incrementAndGet(),"BR","pt-br",null);String root=admin("super_admin","*");
        change(root,id,"TIMO",true,0,200);
        LocalDate date=LocalDate.now(ZoneOffset.UTC).minusDays(1);
        String url="/api/distribution/commission-reports/"+id;
        mvc.perform(get(url+"/invitees/"+stranger.getUserId()).param("platformCode","TIMO").param("startDate",date.toString()).param("endDate",date.toString())
                .header("X-Distribution-Token",user.getApiAccessToken())).andExpect(status().isBadRequest());
        change(root,id,"TIMO",false,1,200);
        mvc.perform(get(url).param("platformCode","TIMO").param("startDate",date.toString()).param("endDate",date.toString())
                .header("X-Distribution-Token",user.getApiAccessToken())).andExpect(status().isBadRequest());
    }
    private void account(long id,String token,String platform,int status) throws Exception {
        mvc.perform(get("/api/distribution/accounts/"+id).param("platformCode",platform).header("X-Distribution-Token",token)).andExpect(status().is(status));
    }
    private void change(String root,long id,String app,boolean enabled,long version,int status) throws Exception {
        mvc.perform(put(path(id)+"/"+app).header("X-Admin-Session",root).contentType(MediaType.APPLICATION_JSON)
                .content("{\"enabled\":"+enabled+",\"expectedVersion\":"+version+",\"reason\":\"internal read test\"}")).andExpect(status().is(status));
    }
    private String path(long id){return "/admin/distribution/user-platform-profiles/"+id+"/earnings-read-access";}
    private String admin(String role,String region){
        String name="read_"+IDS.incrementAndGet();String password="Read-Access-Test-2026!";
        var admin=AdminAccount.create(name,name,role,hasher.hash(password),true);admin.updateProfile(name,role,"*","*",region);admins.save(admin);
        return sessions.createSession(name,password,false,"read-test-"+IDS.get(),"JUnit").sessionToken();
    }
}
