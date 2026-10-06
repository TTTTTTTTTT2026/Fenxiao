package com.fenxiao.income.mcn.service;

import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class InvitationRewardAccountServiceTest {
    @Test
    void postsOnlyInvitationShareOfCompanyIncomeAndReconcilesSevenDayFreezeAndRevisions() {
        JdbcTemplate jdbc = database("account_flow");
        MutableClock clock = new MutableClock(Instant.parse("2026-09-24T12:00:00Z"));
        InvitationRewardAccountService service = new InvitationRewardAccountService(jdbc, clock, 7, new InvitationCommissionReportProjector(jdbc));
        LocalDate date = LocalDate.of(2026, 9, 24);
        jdbc.update("INSERT INTO token_point_conversion_version(id,platform_code,token_unit,points_per_token,rule_status,effective_from) VALUES (1,'TIMO','TIMO_DIAMOND',2,'ACTIVE',?)",
                Timestamp.from(clock.instant().minusSeconds(60)));
        candidate(jdbc, "v1", "25.000000", "2.500000");

        service.reconcile("TIMO", date);
        service.reconcile("TIMO", date);
        assertThat(balance(jdbc, "frozen_points")).isEqualByComparingTo("5.000000");
        assertThat(balance(jdbc, "available_points")).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM invitation_reward_account_ledger", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT raw_diamonds FROM invitation_reward_entry", BigDecimal.class)).isEqualByComparingTo("100");

        clock.advanceDays(7);
        assertThat(service.releaseDue()).isEqualTo(1);
        assertThat(balance(jdbc, "frozen_points")).isZero();
        assertThat(balance(jdbc, "available_points")).isEqualByComparingTo("5.000000");

        jdbc.update("UPDATE mcn_income_reward_candidate_projection SET source_revision='v2',base_amount=50,company_income_base_amount=12.5,candidate_amount=1.25 WHERE source_event_id='event-1'");
        service.reconcile("TIMO", date);
        assertThat(balance(jdbc, "available_points")).isEqualByComparingTo("2.500000");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM invitation_reward_account_ledger", Integer.class)).isEqualTo(3);
        assertThat(jdbc.queryForObject("SELECT source_revision FROM invitation_reward_account_ledger WHERE event_type='INVITATION_REWARD'", String.class)).isEqualTo("v1");
        UserDistributionProfileRepository users = mock(UserDistributionProfileRepository.class);
        when(users.existsById(2L)).thenReturn(true);
        var corrected = new InvitationRewardAccountQueryService(jdbc, users).get(2L, 0, 20);
        assertThat(corrected.cumulativeIncomePoints()).isEqualByComparingTo("2.500000");
        assertThat(corrected.directIncomePoints()).isEqualByComparingTo("2.500000");

        jdbc.update("UPDATE mcn_income_reward_candidate_projection SET source_revision='v3',base_amount=120,company_income_base_amount=30,candidate_amount=3 WHERE source_event_id='event-1'");
        service.reconcile("TIMO", date);
        assertThat(balance(jdbc, "frozen_points")).isEqualByComparingTo("3.500000");
        assertThat(balance(jdbc, "available_points")).isEqualByComparingTo("2.500000");
        assertThat(service.releaseDue()).isZero();
        clock.advanceDays(7);
        assertThat(service.releaseDue()).isEqualTo(1);
        assertThat(balance(jdbc, "available_points")).isEqualByComparingTo("6.000000");

        jdbc.update("UPDATE mcn_income_reward_candidate_projection SET candidate_status='BLOCKED_SOURCE_REVOKED' WHERE source_event_id='event-1'");
        service.reconcile("TIMO", date);
        assertThat(balance(jdbc, "available_points")).isZero();
        assertThat(balance(jdbc, "frozen_points")).isZero();
    }

    @Test
    void doesNotPostUntilThePlatformPointConversionIsConfigured() {
        JdbcTemplate jdbc = database("conversion_gate");
        MutableClock clock = new MutableClock(Instant.parse("2026-09-24T12:00:00Z"));
        InvitationRewardAccountService service = new InvitationRewardAccountService(jdbc, clock, 7, new InvitationCommissionReportProjector(jdbc));
        candidate(jdbc, "v1", "25.000000", "2.500000");
        service.reconcile("TIMO", LocalDate.of(2026, 9, 24));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM invitation_reward_entry", Integer.class)).isZero();
        jdbc.update("INSERT INTO token_point_conversion_version(id,platform_code,token_unit,points_per_token,rule_status,effective_from) VALUES (1,'TIMO','TIMO_DIAMOND',2,'ACTIVE',?)",
                Timestamp.from(clock.instant().minusSeconds(60)));
        service.backfill();
        assertThat(balance(jdbc, "frozen_points")).isEqualByComparingTo("5.000000");
    }

    @Test
    void indirectLinkyIncomeUsesThreePercentOfCompanyIncomeAndItsOwnConversion() {
        JdbcTemplate jdbc = database("indirect_linky");
        MutableClock clock = new MutableClock(Instant.parse("2026-09-24T12:00:00Z"));
        jdbc.update("INSERT INTO token_point_conversion_version(id,platform_code,token_unit,points_per_token,rule_status,effective_from) VALUES (2,'LINKY','LINKY_DIAMOND',4,'ACTIVE',?)",
                Timestamp.from(clock.instant().minusSeconds(60)));
        jdbc.update("""
                INSERT INTO mcn_income_reward_candidate_projection
                (source_system,platform_code,source_event_id,reward_level,recipient_user_id,source_revision,business_date,
                occurred_at,source_user_id,source_guild_id,base_amount,company_share_rate,company_income_base_amount,
                rule_rate,candidate_amount,amount_unit,candidate_status,calculation_version)
                VALUES ('MCN','LINKY','event-linky',2,2,'v1','2026-09-24','2026-09-24 10:00:00',1,'guild',100,0.25,25,
                0.03,0.75,'LINKY_DIAMOND','CANDIDATE','INVITATION_COMPANY_INCOME_V2')
                """);
        new InvitationRewardAccountService(jdbc, clock, 7, new InvitationCommissionReportProjector(jdbc)).reconcile("LINKY", LocalDate.of(2026, 9, 24));
        assertThat(balance(jdbc, "frozen_points")).isEqualByComparingTo("3.000000");
        UserDistributionProfileRepository users = mock(UserDistributionProfileRepository.class);
        when(users.existsById(2L)).thenReturn(true);
        var account = new InvitationRewardAccountQueryService(jdbc, users).get(2L, 0, 20);
        assertThat(account.directIncomePoints()).isZero();
        assertThat(account.indirectIncomePoints()).isEqualByComparingTo("3.000000");
        assertThat(account.items().getFirst().rewardDiamonds()).isEqualByComparingTo("0.750000");
    }

    @Test
    void exposesOnlyTheRequestedUsersPagedAccountHistory() {
        JdbcTemplate jdbc = database("account_query");
        MutableClock clock = new MutableClock(Instant.parse("2026-09-24T12:00:00Z"));
        jdbc.update("INSERT INTO token_point_conversion_version(id,platform_code,token_unit,points_per_token,rule_status,effective_from) VALUES (1,'TIMO','TIMO_DIAMOND',2,'ACTIVE',?)",
                Timestamp.from(clock.instant().minusSeconds(60)));
        candidate(jdbc, "v1", "25.000000", "2.500000");
        new InvitationRewardAccountService(jdbc, clock, 7, new InvitationCommissionReportProjector(jdbc)).reconcile("TIMO", LocalDate.of(2026, 9, 24));
        UserDistributionProfileRepository users = mock(UserDistributionProfileRepository.class);
        when(users.existsById(2L)).thenReturn(true);
        InvitationRewardAccountQueryService query = new InvitationRewardAccountQueryService(jdbc, users);

        var page = query.get(2L, 0, 1);
        assertThat(page.frozenPoints()).isEqualByComparingTo("5.000000");
        assertThat(page.availablePoints()).isZero();
        assertThat(page.directIncomePoints()).isEqualByComparingTo("5.000000");
        assertThat(page.indirectIncomePoints()).isZero();
        assertThat(page.withdrawalEnabled()).isFalse();
        assertThat(page.totalRecords()).isEqualTo(1);
        assertThat(page.items()).hasSize(1);
        assertThat(page.items().getFirst().rawDiamonds()).isEqualByComparingTo("100");
        assertThat(query.get(2L, 1, 1).items()).isEmpty();
        assertThatThrownBy(() -> query.get(3L, 0, 1)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void rejectsCandidateThatConvertsRawIncomeInsteadOfItsCalculatedInvitationReward() {
        var candidate = new InvitationRewardAccountService.Candidate("LINKY", "bad", 1, 2L, "v1",
                LocalDate.of(2026, 9, 24), Instant.parse("2026-09-24T00:00:00Z"), 1L, "guild",
                new BigDecimal("100"), new BigDecimal("0.25"), new BigDecimal("25"),
                new BigDecimal("0.10"), new BigDecimal("25"), "LINKY_DIAMOND");
        assertThatThrownBy(() -> InvitationRewardAccountService.points(candidate, BigDecimal.ONE))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("does not reconcile");
    }

    @Test
    void commissionReportSeparatesDirectAndIndirectSourcesWithoutCountingUnlocks() {
        JdbcTemplate jdbc = database("commission_report");
        MutableClock clock = new MutableClock(Instant.parse("2026-09-24T12:00:00Z"));
        jdbc.update("INSERT INTO token_point_conversion_version(id,platform_code,token_unit,points_per_token,rule_status,effective_from) VALUES (1,'TIMO','TIMO_DIAMOND',2,'ACTIVE',?)",
                Timestamp.from(clock.instant().minusSeconds(60)));
        jdbc.update("INSERT INTO invitation_relation_version VALUES (1,2,1,'2026-09-01 00:00:00',NULL)");
        jdbc.update("INSERT INTO invitation_relation_version VALUES (3,1,1,'2026-09-01 00:00:00',NULL)");
        jdbc.update("INSERT INTO invitation_relation_version VALUES (4,1,1,'2026-09-01 00:00:00',NULL)");
        jdbc.update("INSERT INTO user_public_profile VALUES (1,'B')");
        jdbc.update("INSERT INTO user_public_profile VALUES (3,'C')");
        candidate(jdbc, "v1", "25.000000", "2.500000");
        jdbc.update("""
                INSERT INTO mcn_income_reward_candidate_projection
                (source_system,platform_code,source_event_id,reward_level,recipient_user_id,source_revision,business_date,
                occurred_at,source_user_id,source_guild_id,base_amount,company_share_rate,company_income_base_amount,
                rule_rate,candidate_amount,amount_unit,candidate_status,calculation_version)
                VALUES ('MCN','TIMO','event-c',2,2,'v1','2026-09-24','2026-09-24 10:00:00',3,'guild',100,0.25,25,
                0.03,0.75,'TIMO_DIAMOND','CANDIDATE','INVITATION_COMPANY_INCOME_V2')
                """);
        InvitationRewardAccountService account = new InvitationRewardAccountService(jdbc, clock, 7, new InvitationCommissionReportProjector(jdbc));
        InvitationCommissionReportService report = new InvitationCommissionReportService(jdbc, clock);
        LocalDate date = LocalDate.of(2026, 9, 24);
        account.reconcile("TIMO", date);
        var first = report.report(2, "TIMO", date, date, 0, 20);
        assertThat(first.directPoints()).isEqualByComparingTo("5.000000");
        assertThat(first.indirectPoints()).isEqualByComparingTo("1.500000");
        assertThat(first.totalPoints()).isEqualByComparingTo("6.500000");
        Long existingLedgerId = jdbc.queryForObject("SELECT MIN(id) FROM invitation_reward_account_ledger", Long.class);
        new InvitationCommissionReportProjector(jdbc).recordLedger(existingLedgerId);
        assertThat(report.report(2, "TIMO", date, date, 0, 20).totalPoints()).isEqualByComparingTo("6.500000");
        assertThat(first.items()).hasSize(1);
        assertThat(first.items().getFirst().userId()).isEqualTo(1);
        assertThat(first.items().getFirst().nickname()).isEqualTo("B");
        assertThat(report.sources(2, "TIMO", 1, date, date, 0, 20).items().getFirst().userId()).isEqualTo(3);
        assertThat(report.sources(2, "TIMO", 1, date, date, 0, 20).items()).hasSize(2);
        assertThat(report.sources(2, "TIMO", 1, date, date, 0, 20).items().get(1).points()).isZero();
        assertThat(report.sources(2, "TIMO", 1, date, date, 0, 20).indirectPoints()).isEqualByComparingTo("1.500000");
        assertThat(report.report(2, "LINKY", date, date, 0, 20).totalPoints()).isZero();
        assertThatThrownBy(() -> report.sources(2, "TIMO", 99, date, date, 0, 20))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> report.report(2, "TIMO", date.minusDays(60), date, 0, 20))
                .isInstanceOf(IllegalArgumentException.class);

        clock.advanceDays(7);
        assertThat(account.releaseDue()).isEqualTo(2);
        assertThat(report.report(2, "TIMO", date, date, 0, 20).totalPoints()).isEqualByComparingTo("6.500000");
        jdbc.update("UPDATE mcn_income_reward_candidate_projection SET candidate_status='BLOCKED_SOURCE_REVOKED' WHERE source_event_id='event-c'");
        account.reconcile("TIMO", date);
        LocalDate correctionDay = LocalDate.of(2026, 10, 1);
        assertThat(report.report(2, "TIMO", correctionDay, correctionDay, 0, 20).indirectPoints())
                .isEqualByComparingTo("-1.500000");
    }

    @Test
    void migrationBackfillsHistoricalCommissionWithoutReplayingUnlocks() {
        var source = new DriverManagerDataSource("jdbc:h2:mem:commission_backfill;MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", "");
        JdbcTemplate jdbc = new JdbcTemplate(source);
        jdbc.execute("CREATE TABLE token_point_conversion_version(id BIGINT PRIMARY KEY)");
        jdbc.update("INSERT INTO token_point_conversion_version VALUES (1)");
        new ResourceDatabasePopulator(new ClassPathResource("db/migration/V66__add_invitation_reward_account.sql")).execute(source);
        jdbc.execute("CREATE TABLE invitation_relation_version(user_id BIGINT,inviter_user_id BIGINT,version_no INT,effective_from TIMESTAMP,effective_to TIMESTAMP)");
        jdbc.update("INSERT INTO invitation_relation_version VALUES (3,1,1,'2026-09-01 00:00:00',NULL)");
        jdbc.update("""
                INSERT INTO invitation_reward_entry
                (id,user_id,platform_code,source_event_id,reward_level,source_revision,business_date,occurred_at,
                source_user_id,source_guild_id,raw_diamonds,company_share_rate,company_income_diamonds,
                invitation_rate,reward_diamonds,conversion_id,points_per_diamond,reward_points,recorded_at)
                VALUES (1,2,'TIMO','historical',2,'v1','2026-09-24','2026-09-24 10:00:00',3,'guild',100,
                0.25,25,0.03,0.75,1,2,1.5,'2026-09-24 12:00:00')
                """);
        jdbc.update("""
                INSERT INTO invitation_reward_account_ledger
                (id,user_id,entry_id,event_type,frozen_delta,available_delta,reason,platform_code,source_event_id,
                source_revision,reward_level,source_user_id,raw_diamonds,company_share_rate,company_income_diamonds,
                invitation_rate,reward_diamonds,points_per_diamond,conversion_id,created_at)
                VALUES (1,2,1,'INVITATION_REWARD',1.5,0,'INVITATION_REWARD','TIMO','historical',
                'v1',2,3,100,0.25,25,0.03,0.75,2,1,'2026-09-24 12:00:00')
                """);
        jdbc.update("""
                INSERT INTO invitation_reward_account_ledger
                (id,user_id,entry_id,event_type,frozen_delta,available_delta,reason,platform_code,source_event_id,
                source_revision,reward_level,source_user_id,raw_diamonds,company_share_rate,company_income_diamonds,
                invitation_rate,reward_diamonds,points_per_diamond,conversion_id,created_at)
                VALUES (2,2,1,'UNFREEZE',-1.5,1.5,'UNFREEZE','TIMO','historical',
                'v1',2,3,100,0.25,25,0.03,0.75,2,1,'2026-10-01 12:00:00')
                """);
        new ResourceDatabasePopulator(new ClassPathResource("db/migration/V74__add_invitation_commission_report_projection.sql")).execute(source);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM invitation_commission_report_event", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT direct_invitee_user_id FROM invitation_commission_report_daily", Long.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT points_delta FROM invitation_commission_report_daily", BigDecimal.class))
                .isEqualByComparingTo("1.500000");
    }

    private static JdbcTemplate database(String name) {
        var source = new DriverManagerDataSource("jdbc:h2:mem:" + name + ";MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", "");
        JdbcTemplate jdbc = new JdbcTemplate(source);
        jdbc.execute("""
                CREATE TABLE mcn_income_reward_candidate_projection(id BIGINT AUTO_INCREMENT PRIMARY KEY,
                source_system VARCHAR(32),platform_code VARCHAR(32),source_event_id VARCHAR(128),reward_level INT,
                recipient_user_id BIGINT,source_revision VARCHAR(512),business_date DATE,occurred_at TIMESTAMP,
                source_user_id BIGINT,source_guild_id VARCHAR(64),base_amount DECIMAL(18,6),company_share_rate DECIMAL(8,6),
                company_income_base_amount DECIMAL(18,6),rule_rate DECIMAL(8,6),candidate_amount DECIMAL(18,6),
                amount_unit VARCHAR(32),candidate_status VARCHAR(64),calculation_version VARCHAR(32))
                """);
        jdbc.execute("""
                CREATE TABLE token_point_conversion_version(id BIGINT PRIMARY KEY,platform_code VARCHAR(32),
                token_unit VARCHAR(32),points_per_token DECIMAL(18,6),rule_status VARCHAR(16),
                effective_from TIMESTAMP,effective_to TIMESTAMP)
                """);
        new ResourceDatabasePopulator(new ClassPathResource("db/migration/V66__add_invitation_reward_account.sql")).execute(source);
        jdbc.execute("CREATE TABLE invitation_relation_version(user_id BIGINT,inviter_user_id BIGINT,version_no INT,effective_from TIMESTAMP,effective_to TIMESTAMP)");
        jdbc.execute("CREATE TABLE user_public_profile(user_id BIGINT PRIMARY KEY,nickname VARCHAR(40))");
        new ResourceDatabasePopulator(new ClassPathResource("db/migration/V74__add_invitation_commission_report_projection.sql")).execute(source);
        return jdbc;
    }

    private static void candidate(JdbcTemplate jdbc, String revision, String company, String reward) {
        jdbc.update("""
                INSERT INTO mcn_income_reward_candidate_projection
                (source_system,platform_code,source_event_id,reward_level,recipient_user_id,source_revision,business_date,
                occurred_at,source_user_id,source_guild_id,base_amount,company_share_rate,company_income_base_amount,
                rule_rate,candidate_amount,amount_unit,candidate_status,calculation_version)
                VALUES ('MCN','TIMO','event-1',1,2,?,'2026-09-24','2026-09-24 10:00:00',1,'guild',100,0.25,?,0.10,?,
                'TIMO_DIAMOND','CANDIDATE','INVITATION_COMPANY_INCOME_V2')
                """, revision, new BigDecimal(company), new BigDecimal(reward));
    }

    private static BigDecimal balance(JdbcTemplate jdbc, String column) {
        return jdbc.queryForObject("SELECT " + column + " FROM invitation_reward_account WHERE user_id=2", BigDecimal.class);
    }

    private static final class MutableClock extends Clock {
        private Instant instant;
        private MutableClock(Instant instant) { this.instant = instant; }
        void advanceDays(long days) { instant = instant.plusSeconds(days * 86400); }
        @Override public ZoneId getZone() { return ZoneId.of("UTC"); }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return instant; }
    }
}
