package com.fenxiao.income.mcn.service;

import com.fenxiao.platform.service.PlatformGuildCompanyShareService;
import com.fenxiao.relationship.entity.InvitationRelationVersion;
import com.fenxiao.relationship.repository.InvitationRelationVersionRepository;
import com.fenxiao.rule.entity.CommissionPolicy;
import com.fenxiao.rule.service.CommissionPolicyService;
import com.fenxiao.user.entity.UserDistributionProfile;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.*;
import java.util.Optional;
import java.util.UUID;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** Real source-day SQL, candidate snapshots, formal points and report writes; no MCN calls. */
class InvitationBindingDayIntegrationTest {
    private static final LocalDate DAY=LocalDate.of(2026,10,12);
    private static final Instant START=Instant.parse("2026-10-11T16:00:00Z"),END=Instant.parse("2026-10-12T16:00:00Z");
    private static final Clock CLOCK=Clock.fixed(Instant.parse("2026-10-13T12:00:00Z"),ZoneOffset.UTC);

    @Test void sameDayDirectAndIndirectIncomePostsOnceAndDrillsIntoTheCorrectBranch() {
        Fixture f=fixture();
        assertThat(f.candidates.refresh("TIMO",DAY).candidateCount()).isEqualTo(2);
        f.accounts.reconcile("TIMO",DAY);
        f.candidates.refresh("TIMO",DAY);f.accounts.reconcile("TIMO",DAY);
        assertThat(f.jdbc.queryForObject("SELECT COUNT(*) FROM invitation_reward_entry",Integer.class)).isEqualTo(2);
        assertThat(f.jdbc.queryForObject("SELECT COUNT(*) FROM invitation_reward_account_ledger",Integer.class)).isEqualTo(2);
        assertThat(points(f.jdbc,200)).isEqualByComparingTo("5.000000");
        assertThat(points(f.jdbc,300)).isEqualByComparingTo("1.500000");
        assertThat(f.jdbc.queryForObject("SELECT direct_invitee_user_id FROM invitation_commission_report_daily WHERE user_id=300",Long.class)).isEqualTo(200);
        assertThat(f.jdbc.queryForObject("SELECT points_delta FROM invitation_commission_report_daily WHERE user_id=300",BigDecimal.class)).isEqualByComparingTo("1.500000");
        assertThat(f.jdbc.queryForObject("SELECT COUNT(*) FROM invitation_commission_report_daily WHERE platform_code='LINKY'",Integer.class)).isZero();
        assertThat(f.jdbc.queryForObject("SELECT occurred_at FROM mcn_income_raw_ledger_event",Timestamp.class).toInstant()).isEqualTo(START);
        verify(f.policies,times(2)).findEffective("TIMO","ID",LocalDateTime.ofInstant(START,ZoneOffset.UTC));
        // Corrections/reversals still follow the original ledger, not a new credit on each refresh.
        f.jdbc.update("UPDATE mcn_income_raw_ledger_event SET amount=120");
        f.candidates.refresh("TIMO",DAY);f.accounts.reconcile("TIMO",DAY);
        assertThat(points(f.jdbc,200)).isEqualByComparingTo("6.000000");
        assertThat(points(f.jdbc,300)).isEqualByComparingTo("1.800000");
        f.jdbc.update("UPDATE mcn_income_shadow_ledger_projection SET shadow_status='VOIDED'");
        f.candidates.refresh("TIMO",DAY);f.accounts.reconcile("TIMO",DAY);
        assertThat(points(f.jdbc,200)).isZero();assertThat(points(f.jdbc,300)).isZero();
        assertThat(f.jdbc.queryForObject("SELECT SUM(points_delta) FROM invitation_commission_report_daily",BigDecimal.class)).isZero();
    }

    @Test void aBindingAtTheNextSourceDayMidnightDoesNotClaimThePreviousDay() {
        Fixture f=fixture();
        when(f.verified.byUser("TIMO",100L)).thenReturn(Optional.of(new McnIncomeVerifiedAccounts.Account(100L,"synthetic",utc(END))));
        assertThat(f.candidates.refresh("TIMO",DAY).candidateCount()).isZero();
        f.accounts.reconcile("TIMO",DAY);
        assertThat(f.jdbc.queryForObject("SELECT COUNT(*) FROM invitation_reward_entry",Integer.class)).isZero();
        assertThat(f.jdbc.queryForObject("SELECT candidate_status FROM mcn_income_reward_candidate_projection",String.class)).isEqualTo("BLOCKED_BINDING_NOT_EFFECTIVE");
    }

    @Test void futureInvitationsCannotClaimEarlierIncome() {
        Fixture f=fixture();
        var future=InvitationRelationVersion.create(100L,200L,1,utc(END),"test","INVITE_CODE",null,null);
        when(f.relations.findByUserIdAndVersionNo(100L,1)).thenReturn(Optional.of(future));
        assertThat(f.candidates.refresh("TIMO",DAY).candidateCount()).isZero();
        assertThat(f.jdbc.queryForObject("SELECT COUNT(*) FROM mcn_income_reward_candidate_projection WHERE candidate_status='BLOCKED_NO_INVITER'",Integer.class)).isEqualTo(1);
    }

    @Test void aTransferDuringTheDayDoesNotReplaceTheOwnerAlreadyEffectiveAtDayStart() {
        Fixture f=fixture();
        var prior=InvitationRelationVersion.create(100L,200L,1,utc(START.minusSeconds(3600)),"test","INVITE_CODE",null,null);
        prior.endAt(utc(START.plusSeconds(3600)));
        when(f.relations.findEffectiveAt(100L,utc(START))).thenReturn(Optional.of(prior));
        f.candidates.refresh("TIMO",DAY);
        verify(f.relations,never()).findByUserIdAndVersionNo(100L,1);
        assertThat(f.jdbc.queryForObject("SELECT recipient_user_id FROM mcn_income_reward_candidate_projection WHERE reward_level=1",Long.class)).isEqualTo(200);
    }

    @Test void malformedDailyMetadataFailsClosedAndUnverifiedAccountsStillReceiveNothing() {
        Fixture f=fixture();
        f.jdbc.update("UPDATE mcn_income_raw_ledger_event SET source_timezone='UTC'");
        f.candidates.refresh("TIMO",DAY);
        assertThat(f.jdbc.queryForObject("SELECT candidate_status FROM mcn_income_reward_candidate_projection",String.class)).isEqualTo("BLOCKED_INVALID_INCOME_DAY");
        f.jdbc.update("UPDATE mcn_income_raw_ledger_event SET source_timezone='Asia/Shanghai'");
        when(f.verified.byUser("TIMO",100L)).thenReturn(Optional.empty());
        f.candidates.refresh("TIMO",DAY);f.accounts.reconcile("TIMO",DAY);
        assertThat(f.jdbc.queryForObject("SELECT COUNT(*) FROM invitation_reward_entry",Integer.class)).isZero();
    }

    @Test void linkyUsesItsOwnSourceTimezoneAndConversionWithoutTouchingTimo() {
        Fixture f=fixture();
        Instant start=Instant.parse("2026-10-12T03:00:00Z"),end=Instant.parse("2026-10-13T03:00:00Z");
        f.jdbc.update("UPDATE mcn_income_raw_ledger_event SET platform_code='LINKY',amount_unit='LINKY_DIAMOND',source_timezone='America/Sao_Paulo',occurred_at=?,period_start=?,period_end=?",Timestamp.from(start),Timestamp.from(start),Timestamp.from(end));
        f.jdbc.update("UPDATE mcn_income_shadow_ledger_projection SET platform_code='LINKY'");
        f.jdbc.update("INSERT INTO token_point_conversion_version VALUES(2,'LINKY','LINKY_DIAMOND',4,'ACTIVE',?,NULL)",Timestamp.from(start.minusSeconds(86400)));
        when(f.verified.byUser("LINKY",100L)).thenReturn(Optional.of(new McnIncomeVerifiedAccounts.Account(100L,"synthetic-linky",utc(start.plusSeconds(3600)))));
        var policy=CommissionPolicy.draft("LINKY-TEST","LINKY","ID",2,true,new BigDecimal("0.10"),7,true,new BigDecimal("0.03"),7,false,null,null,utc(start.minusSeconds(86400)),null,1L);
        when(f.policies.findEffective("LINKY","ID",utc(start))).thenReturn(Optional.of(policy));
        when(f.shares.findEffective("LINKY","guild",utc(start))).thenReturn(Optional.of(new BigDecimal("0.25")));
        assertThat(f.candidates.refresh("LINKY",DAY).candidateCount()).isEqualTo(2);
        f.accounts.reconcile("LINKY",DAY);
        assertThat(points(f.jdbc,200)).isEqualByComparingTo("10.000000");
        assertThat(points(f.jdbc,300)).isEqualByComparingTo("3.000000");
        assertThat(f.jdbc.queryForObject("SELECT COUNT(*) FROM invitation_reward_entry WHERE platform_code='TIMO'",Integer.class)).isZero();
    }

    @Test void aFirstDayTransferStillAttributesTheWholeDayToTheInitialInvitation() {
        Fixture f=fixture();
        f.jdbc.update("UPDATE invitation_relation_version SET effective_to=? WHERE user_id=100",Timestamp.from(START.plusSeconds(28800)));
        f.jdbc.update("INSERT INTO invitation_relation_version VALUES(100,400,2,?,NULL)",Timestamp.from(START.plusSeconds(28800)));
        f.candidates.refresh("TIMO",DAY);f.accounts.reconcile("TIMO",DAY);
        assertThat(f.jdbc.queryForObject("SELECT user_id FROM invitation_reward_entry WHERE reward_level=1",Long.class)).isEqualTo(200);
        assertThat(f.jdbc.queryForObject("SELECT direct_invitee_user_id FROM invitation_commission_report_daily WHERE user_id=300",Long.class)).isEqualTo(200);
    }

    private Fixture fixture() {
        var ds=new DriverManagerDataSource("jdbc:h2:mem:binding_day_"+UUID.randomUUID()+";MODE=MySQL;DB_CLOSE_DELAY=-1","sa","");
        var jdbc=new JdbcTemplate(ds);
        jdbc.execute("CREATE TABLE platform_target_guild(platform_code VARCHAR(32),official_guild_id VARCHAR(64),operating_share_rate DECIMAL(8,6))");
        jdbc.execute("CREATE TABLE token_point_conversion_version(id BIGINT PRIMARY KEY,platform_code VARCHAR(32),token_unit VARCHAR(32),points_per_token DECIMAL(18,6),rule_status VARCHAR(16),effective_from TIMESTAMP,effective_to TIMESTAMP)");
        jdbc.execute("CREATE TABLE invitation_relation_version(user_id BIGINT,inviter_user_id BIGINT,version_no INT,effective_from TIMESTAMP,effective_to TIMESTAMP)");
        for(String file:new String[]{"V35__add_mcn_income_reward_candidate_shadow.sql","V36__add_commission_policy_configuration.sql","V42__add_mcn_income_reward_candidate_run_snapshot.sql","V66__add_invitation_reward_account.sql","V74__add_invitation_commission_report_projection.sql"}) {
            new ResourceDatabasePopulator(new ClassPathResource("db/migration/"+file)).execute(ds);
        }
        // H2 cannot run V51's multi-column MySQL AFTER syntax; preserve the production migration unchanged.
        for(String table:new String[]{"mcn_income_reward_candidate_projection","mcn_income_reward_candidate_run_item"}) {
            jdbc.execute("ALTER TABLE "+table+" ADD COLUMN calculation_version VARCHAR(32) DEFAULT 'LEGACY_V1'");
            jdbc.execute("ALTER TABLE "+table+" ADD COLUMN source_guild_id VARCHAR(64)");
            jdbc.execute("ALTER TABLE "+table+" ADD COLUMN company_share_rate DECIMAL(8,6)");
            jdbc.execute("ALTER TABLE "+table+" ADD COLUMN company_income_base_amount DECIMAL(18,6)");
        }
        jdbc.execute("CREATE TABLE mcn_income_team_reward_reserve_fact(source_system VARCHAR(32),platform_code VARCHAR(32),source_event_id VARCHAR(128),source_revision VARCHAR(512),business_date DATE,occurred_at TIMESTAMP,source_user_id BIGINT,source_guild_id VARCHAR(64),company_share_rate DECIMAL(8,6),company_income_base_amount DECIMAL(18,6),reserve_rate DECIMAL(8,6),reserve_amount DECIMAL(18,6),currency_code VARCHAR(16),amount_unit VARCHAR(32),reserve_status VARCHAR(32),decision_reason VARCHAR(128),projected_at TIMESTAMP,PRIMARY KEY(source_system,platform_code,source_event_id))");
        jdbc.execute("ALTER TABLE invitation_commission_report_event ADD COLUMN business_date DATE");
        jdbc.execute("ALTER TABLE invitation_commission_report_event ADD COLUMN source_guild_id VARCHAR(64)");
        jdbc.execute("ALTER TABLE invitation_commission_report_event ADD COLUMN occurred_at TIMESTAMP");
        jdbc.execute("CREATE TABLE mcn_income_raw_ledger_event(id BIGINT PRIMARY KEY,source_system VARCHAR(32),platform_code VARCHAR(32),source_event_id VARCHAR(128),source_revision VARCHAR(512),occurred_at TIMESTAMP,amount DECIMAL(18,6),currency_code VARCHAR(16),amount_unit VARCHAR(32),fact_granularity VARCHAR(32),source_timezone VARCHAR(64),period_start TIMESTAMP,period_end TIMESTAMP)");
        jdbc.execute("CREATE TABLE mcn_income_shadow_ledger_projection(source_system VARCHAR(32),platform_code VARCHAR(32),source_event_id VARCHAR(128),raw_ledger_event_id BIGINT,source_revision VARCHAR(512),business_date DATE,resolved_user_id BIGINT,guild_id VARCHAR(64),shadow_status VARCHAR(32))");
        jdbc.update("INSERT INTO mcn_income_raw_ledger_event VALUES(1,'MCN','TIMO','synthetic-day','v1',?,100,'XXX','TIMO_DIAMOND','ACCOUNT_GUILD_DAY','Asia/Shanghai',?,?)",Timestamp.from(START),Timestamp.from(START),Timestamp.from(END));
        jdbc.update("INSERT INTO mcn_income_shadow_ledger_projection VALUES('MCN','TIMO','synthetic-day',1,'v1',?,100,'guild','BOUND_FINAL')",DAY);
        jdbc.update("INSERT INTO token_point_conversion_version VALUES(1,'TIMO','TIMO_DIAMOND',2,'ACTIVE',?,NULL)",Timestamp.from(START.minusSeconds(86400)));
        jdbc.update("INSERT INTO invitation_relation_version VALUES(100,200,1,?,NULL)",Timestamp.from(START.plusSeconds(3600)));
        jdbc.update("INSERT INTO invitation_relation_version VALUES(200,300,1,?,NULL)",Timestamp.from(START.plusSeconds(7200)));
        var relations=mock(InvitationRelationVersionRepository.class);
        when(relations.findEffectiveAt(anyLong(),any())).thenAnswer(call->{
            long id=call.getArgument(0); LocalDateTime at=call.getArgument(1);
            var rows=jdbc.query("SELECT user_id,inviter_user_id,version_no,effective_from FROM invitation_relation_version WHERE user_id=? AND effective_from<=? AND (effective_to IS NULL OR effective_to>?)",(rs,n)->InvitationRelationVersion.create(rs.getLong(1),rs.getLong(2),rs.getInt(3),rs.getTimestamp(4).toLocalDateTime(),"test","INVITE_CODE",null,null),id,Timestamp.valueOf(at),Timestamp.valueOf(at));
            return rows.stream().findFirst();
        });
        when(relations.findByUserIdAndVersionNo(anyLong(),eq(1))).thenAnswer(call->{
            Long id=call.getArgument(0);
            return jdbc.query("SELECT user_id,inviter_user_id,version_no,effective_from FROM invitation_relation_version WHERE user_id=? AND version_no=1",(rs,n)->InvitationRelationVersion.create(rs.getLong(1),rs.getLong(2),rs.getInt(3),rs.getTimestamp(4).toLocalDateTime(),"test","INVITE_CODE",null,null),id).stream().findFirst();
        });
        var verified=mock(McnIncomeVerifiedAccounts.class);
        when(verified.byUser("TIMO",100L)).thenReturn(Optional.of(new McnIncomeVerifiedAccounts.Account(100L,"synthetic",utc(START.plusSeconds(36000)))));
        var users=mock(UserDistributionProfileRepository.class);
        for(long id:new long[]{100,200,300})when(users.findById(id)).thenReturn(Optional.of(UserDistributionProfile.create(id,"ID","id","SYNTHETIC-"+id)));
        var policy=CommissionPolicy.draft("SYNTHETIC","TIMO","ID",2,true,new BigDecimal("0.10"),7,true,new BigDecimal("0.03"),7,false,null,null,utc(START.minusSeconds(86400)),null,1L);
        var policies=mock(CommissionPolicyService.class);when(policies.findEffective("TIMO","ID",utc(START))).thenReturn(Optional.of(policy));
        var shares=mock(PlatformGuildCompanyShareService.class);when(shares.findEffective("TIMO","guild",utc(START))).thenReturn(Optional.of(new BigDecimal("0.25")));
        var candidates=new McnIncomeRewardCandidateService(jdbc,verified,relations,policies,users,shares,CLOCK);
        var accounts=new InvitationRewardAccountService(jdbc,CLOCK,7,new InvitationCommissionReportProjector(jdbc));
        return new Fixture(jdbc,candidates,accounts,verified,relations,policies,shares);
    }
    private static LocalDateTime utc(Instant at){return LocalDateTime.ofInstant(at,ZoneOffset.UTC);}
    private static BigDecimal points(JdbcTemplate jdbc,long id){return jdbc.queryForObject("SELECT frozen_points FROM invitation_reward_account WHERE user_id=?",BigDecimal.class,id);}
    private record Fixture(JdbcTemplate jdbc,McnIncomeRewardCandidateService candidates,InvitationRewardAccountService accounts,McnIncomeVerifiedAccounts verified,InvitationRelationVersionRepository relations,CommissionPolicyService policies,PlatformGuildCompanyShareService shares){}
}
