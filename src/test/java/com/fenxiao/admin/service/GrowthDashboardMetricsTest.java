package com.fenxiao.admin.service;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import java.time.LocalDate;
import java.time.LocalDateTime;
import static org.assertj.core.api.Assertions.*;

class GrowthDashboardMetricsTest {
    @Test void rankKeepsRegistrationCohortSeparateFromVerificationEventPeriod() {
        var db = db();
        db.update("INSERT INTO user_distribution_profile VALUES (11,'BR','2026-10-01 00:00:00'),(1,'BR','2026-10-29 00:00:00'),(2,'BR','2026-10-30 01:00:00'),(3,'BR','2026-10-30 02:00:00')");
        db.update("INSERT INTO invitation_relation_version VALUES(1,11,1,'INVITE_CODE'),(2,11,1,'INVITE_CODE'),(3,11,1,'INVITE_CODE')");
        db.update("INSERT INTO platform_account_binding VALUES(2,'TIMO','2026-10-30 02:00:00'),(3,'TIMO','2026-10-30 03:00:00')");
        db.update("INSERT INTO platform_binding_history VALUES (1,1,'TIMO','VERIFIED','MCN_TIMO','2026-10-30 04:00:00'),(2,2,'TIMO','VERIFIED','MCN_TIMO','2026-10-30 05:00:00')");
        db.update("INSERT INTO invitation_reward_entry VALUES (11,'TIMO','2026-10-30',12.5),(11,'LINKY','2026-10-30',100)");
        db.update("INSERT INTO invitation_verification_campaign_award VALUES (11,1,'TIMO',12.5,'2026-10-30 05:00:00'),(11,1,'LINKY',100,'2026-10-30 05:00:00')");
        var now=java.time.Instant.parse("2026-10-30T10:00:00Z");
        var service=new GrowthDashboardMetrics(db,java.time.Clock.fixed(now,java.time.ZoneOffset.UTC));
        var start=LocalDateTime.parse("2026-10-30T00:00:00"); var end=start.plusHours(10);
        var result=service.enrich(service.ranks("TIMO","BR",start,end),"TIMO","BR",start,end,true);
        assertThat(result).hasSize(1);
        var item=result.getFirst();
        assertThat(item.newlyVerifiedInvitees()).isEqualTo(2);
        assertThat(item.registered()).isEqualTo(2); assertThat(item.submitted()).isEqualTo(2);
        assertThat(item.cohortVerified()).isEqualTo(1); assertThat(item.firstWithdrawal()).isNull();
        assertThat(item.rewardPoints()).isEqualTo("12.500000");
        assertThat(service.enrich(service.ranks("TIMO","BR",start,end),"TIMO","BR",start,end,false).getFirst().rewardPoints()).isNull();
    }
    @Test void cohortAndParticipantsUseRegistrationWindowWithoutMixingEvents() {
        var db = db();
        db.update("INSERT INTO user_distribution_profile VALUES (1,'BR','2026-10-29 00:00:00'),(2,'BR','2026-10-30 01:00:00'),(3,'BR','2026-10-30 02:00:00')");
        db.update("INSERT INTO invitation_relation_version VALUES(1,11,1,'INVITE_CODE'),(2,11,1,'INVITE_CODE'),(3,11,1,'INVITE_CODE')");
        db.update("INSERT INTO platform_account_binding VALUES(2,'TIMO','2026-10-30 02:00:00')");
        db.update("INSERT INTO platform_binding_history VALUES (1,1,'TIMO','VERIFIED','MCN_TIMO','2026-10-30 04:00:00'),(2,2,'TIMO','VERIFIED','MCN_TIMO','2026-10-30 05:00:00')");
        var clock = java.time.Clock.fixed(java.time.Instant.parse("2026-10-30T10:00:00Z"), java.time.ZoneOffset.UTC);
        var report = new GrowthDashboardMetrics(db, clock).report("TIMO", "BR", "today");
        assertThat(report.registered()).isEqualTo(2);
        assertThat(report.participatingInviters()).isEqualTo(1);
        assertThat(report.submitted()).isEqualTo(1);
        assertThat(report.verified()).isEqualTo(1);
        assertThat(report.ranks()).containsExactly(new GrowthDashboardMetrics.Rank(11, 2));
    }
    @Test void countsFirstVerificationRatherThanRegistrationAndKeepsPlatformSeparate() {
        var db = db();
        db.update("INSERT INTO user_distribution_profile VALUES (1,'BR','2026-10-29 00:00:00'),(2,'ID','2026-10-30 00:00:00')");
        db.update("INSERT INTO invitation_relation_version VALUES(1,11,1,'INVITE_CODE'),(2,12,1,'INVITE_CODE')");
        db.update("INSERT INTO platform_binding_history VALUES (1,1,'TIMO','VERIFIED','MCN_TIMO','2026-10-30 01:00:00'),(2,1,'TIMO','VERIFIED','MCN_TIMO','2026-10-30 02:00:00'),(3,2,'TIMO','VERIFIED','LOCAL_MOCK','2026-10-30 03:00:00')");
        var service = new GrowthDashboardMetrics(db, java.time.Clock.systemUTC());
        var start = LocalDateTime.parse("2026-10-30T00:00:00");
        var ranks = service.ranks("TIMO", "BR", start, start.plusDays(1));
        assertThat(ranks).containsExactly(new GrowthDashboardMetrics.Rank(11,1));
        assertThat(service.ranks("LINKY", "ALL", start, start.plusDays(1))).isEmpty();
        assertThat(service.ranks("TIMO", "ALL", start.plusDays(1), start.plusDays(2))).isEmpty();
    }

    @Test void usesBusinessDayAndCurrentNetEntryWithoutDoubleCountingRelease() {
        var db = db();
        db.update("INSERT INTO invitation_reward_entry VALUES (11,'TIMO','2026-10-30',12.5),(11,'LINKY','2026-10-30',100),(11,'TIMO','2026-10-31',8)");
        var service = new GrowthDashboardMetrics(db, java.time.Clock.systemUTC());
        assertThat(service.rewardPoints(11,"TIMO",LocalDate.parse("2026-10-30"),LocalDate.parse("2026-10-31"))).isEqualByComparingTo("12.5");
        db.update("UPDATE invitation_reward_entry SET reward_points=5 WHERE user_id=11 AND platform_code='TIMO' AND business_date='2026-10-30'");
        assertThat(service.rewardPoints(11,"TIMO",LocalDate.parse("2026-10-30"),LocalDate.parse("2026-10-31"))).isEqualByComparingTo("5");
        assertThatThrownBy(() -> service.rewardPoints(11,"ALL",LocalDate.parse("2026-10-30"),LocalDate.parse("2026-10-31"))).isInstanceOf(IllegalArgumentException.class);
    }

    private JdbcTemplate db() {
        var db = new JdbcTemplate(new DriverManagerDataSource("jdbc:h2:mem:growth_"+System.nanoTime()+";MODE=MySQL;DB_CLOSE_DELAY=-1","sa",""));
        db.execute("CREATE TABLE user_distribution_profile(user_id BIGINT,country_code VARCHAR(10),registered_at TIMESTAMP)");
        db.execute("CREATE TABLE invitation_relation_version(user_id BIGINT,inviter_user_id BIGINT,version_no INT,source_type VARCHAR(40))");
        db.execute("CREATE TABLE platform_binding_history(id BIGINT,user_id BIGINT,platform_code VARCHAR(32),to_status VARCHAR(32),source_system VARCHAR(32),occurred_at TIMESTAMP)");
        db.execute("CREATE TABLE platform_account_binding(user_id BIGINT,platform_code VARCHAR(32),submitted_at TIMESTAMP)");
        db.execute("CREATE TABLE linky_account_binding(user_id BIGINT,created_at TIMESTAMP)");
        db.execute("CREATE TABLE linky_verification_attempt(id BIGINT,user_id BIGINT,result_status VARCHAR(32),membership_status VARCHAR(64),verification_source VARCHAR(32),attempted_at TIMESTAMP)");
        db.execute("CREATE TABLE invitation_reward_entry(user_id BIGINT,platform_code VARCHAR(32),business_date DATE,reward_points DECIMAL(24,6))");
        db.execute("CREATE TABLE invitation_verification_campaign_award(inviter_user_id BIGINT,invited_user_id BIGINT,platform_code VARCHAR(32),reward_points DECIMAL(24,6),awarded_at TIMESTAMP)");
        db.execute("CREATE TABLE user_public_profile(user_id BIGINT,nickname VARCHAR(40))");
        db.execute("CREATE TABLE user_operations_profile(user_id BIGINT,operator_admin_id BIGINT)");
        db.execute("CREATE TABLE admin_account(id BIGINT,display_name VARCHAR(40))");
        return db;
    }
}
