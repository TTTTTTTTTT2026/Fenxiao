package com.fenxiao.admin.service;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import java.time.*;
import static org.assertj.core.api.Assertions.*;

class OperationsDashboardServiceTest {
    @Test void countsUtcEventsCohortsAndCurrentQueuesWithoutMixingApps() {
        JdbcTemplate db=database();seed(db);
        var service=new OperationsDashboardService(db,fixed());
        var report=service.report("TIMO","ID",7,"today");
        assertThat(report.summary().registered()).isEqualTo(4);
        assertThat(report.summary().invited()).isEqualTo(3);
        assertThat(report.summary().cohortVerified()).isEqualTo(2);
        assertThat(report.firstVerified()).isEqualTo(3);
        assertThat(report.summary().pending()).isEqualTo(2);
        assertThat(report.summary().waiting()).isEqualTo(1);
        assertThat(report.trend().getLast().registered()).isEqualTo(4);
        assertThat(report.ranks()).hasSize(1);
        assertThat(report.ranks().getFirst().inviterId()).isEqualTo(1);
        assertThat(report.ranks().getFirst().registered()).isEqualTo(3);
        var linky=service.report("LINKY","ID",7,"today");
        assertThat(linky.summary().registered()).isEqualTo(4);
        assertThat(linky.summary().cohortVerified()).isEqualTo(1);
        assertThat(linky.firstVerified()).isEqualTo(1);
        assertThat(service.report("TIMO","BR",30,"today").summary().registered()).isEqualTo(1);
        assertThat(service.users("TIMO","ID","today","INVITER",1L,null,0,20).items()).extracting(OperationsDashboardService.User::userId).containsExactly(5L,3L,2L);
        assertThat(service.users("TIMO","ID","today","FIRST_VERIFIED",null,null,0,20).total()).isEqualTo(3);
    }
    @Test void deduplicatesRetriedSuccessAndDoesNotRewriteRegistrationInviter() {
        JdbcTemplate db=database();seed(db);
        db.update("INSERT INTO platform_binding_history VALUES(8,2,2,'TIMO','VERIFIED','VERIFIED','MCN_TIMO','2026-10-12 06:00:00')");
        db.update("INSERT INTO invitation_relation_version VALUES(5,99,2,'ADMIN')");
        var service=new OperationsDashboardService(db,fixed());
        var report=service.report("TIMO","ID",7,"today");
        assertThat(report.firstVerified()).isEqualTo(3);
        assertThat(report.ranks().getFirst().inviterId()).isEqualTo(1);
    }
    @Test void treatsMissingHistoricalEvidenceAsUnknownRatherThanZeroAndDoesNotWrite() {
        JdbcTemplate db=database();seed(db);
        db.update("DELETE FROM platform_binding_history WHERE user_id=2");
        long before=db.queryForObject("SELECT COUNT(*) FROM platform_binding_history",Long.class);
        var service=new OperationsDashboardService(db,fixed());
        var report=service.report("TIMO","ALL",7,"today");
        assertThat(report.firstVerified()).isNull();
        assertThat(report.missingVerificationHistoryUsers()).isEqualTo(1);
        assertThat(report.trend()).allMatch(d->d.firstVerified()==null);
        assertThat(report.summary().cohortVerified()).isEqualTo(2);
        assertThat(db.queryForObject("SELECT COUNT(*) FROM platform_binding_history",Long.class)).isEqualTo(before);
    }
    @Test void usesGlobalAnyAppBindingForOverdueAndPaginatesExactly() {
        JdbcTemplate db=database();seed(db);
        var service=new OperationsDashboardService(db,fixed());
        var overdue=service.users("TIMO","ID","today","OVERDUE",null,null,0,20);
        assertThat(overdue.items()).extracting(OperationsDashboardService.User::userId).containsExactly(7L,1L);
        var page=service.users("TIMO","ID","today","REGISTERED",null,null,0,2);
        var next=service.users("TIMO","ID","today","REGISTERED",null,null,1,2);
        assertThat(page.total()).isEqualTo(4);assertThat(page.items()).hasSize(2);
        assertThat(next.items()).extracting(OperationsDashboardService.User::userId).doesNotContainAnyElementsOf(page.items().stream().map(OperationsDashboardService.User::userId).toList());
    }
    @Test void returnsNoFakeRatioAndRejectsUnboundedOrMixedRequests() {
        var service=new OperationsDashboardService(database(),fixed());
        var report=service.report("TIMO","ALL",30,"today");
        assertThat(report.summary().registered()).isZero();assertThat(report.ranks()).isEmpty();
        assertThatThrownBy(()->service.report("ALL","ID",7,"today")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(()->service.report("TIMO","ID' OR 1=1",7,"today")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(()->service.report("TIMO","ID",365,"today")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(()->service.users("TIMO","ID","today","INVITER",null,null,0,20)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(()->service.users("TIMO","ID","today","REGISTERED",null,"2020-01-01",0,20)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(()->service.users("TIMO","ID","today","REGISTERED",null,null,0,10000)).isInstanceOf(IllegalArgumentException.class);
    }
    @Test void cachesAtMost60SecondsAndNeverAcrossUtcMidnight() {
        JdbcTemplate db=database();seed(db);MutableClock clock=new MutableClock(fixed().instant());
        var service=new OperationsDashboardService(db,clock);
        var first=service.report("TIMO","ID",7,"today");
        db.update("INSERT INTO user_distribution_profile VALUES(10,'ID','2026-10-12 08:59:00')");
        assertThat(service.report("TIMO","ID",7,"today")).isSameAs(first);
        clock.at=clock.at.plusSeconds(60);
        assertThat(service.report("TIMO","ID",7,"today").summary().registered()).isEqualTo(6); // boundary user9 now included
        clock.at=Instant.parse("2026-10-12T23:59:50Z");var late=service.report("TIMO","ID",7,"today");
        clock.at=Instant.parse("2026-10-13T00:00:01Z");var tomorrow=service.report("TIMO","ID",7,"today");
        assertThat(tomorrow).isNotSameAs(late);assertThat(tomorrow.summary().registered()).isZero();
    }
    @Test void excludesMockVerificationAndPropagatesDatabaseFailure() {
        JdbcTemplate db=database();seed(db);
        db.update("UPDATE platform_binding_history SET source_system='LOCAL_MOCK' WHERE user_id=2");
        db.update("UPDATE platform_account_binding SET verification_source='LOCAL_MOCK' WHERE user_id=2");
        var service=new OperationsDashboardService(db,fixed());
        assertThat(service.report("TIMO","ID",7,"today").firstVerified()).isEqualTo(2);
        assertThat(service.report("TIMO","ID",7,"today").summary().cohortVerified()).isEqualTo(1);
        db.execute("DROP TABLE user_distribution_profile");
        assertThatThrownBy(()->service.report("TIMO","BR",7,"today")).isInstanceOf(org.springframework.dao.DataAccessException.class);
    }
    @Test void usesTheSameUtcPeriodForRankingAndItsUserList() {
        JdbcTemplate db=database();seed(db);
        db.update("INSERT INTO invitation_relation_version VALUES(4,1,1,'INVITE_CODE')");
        var service=new OperationsDashboardService(db,fixed());
        var yesterday=service.report("TIMO","ID",7,"yesterday");
        assertThat(yesterday.periodStart()).isEqualTo(LocalDateTime.parse("2026-10-11T00:00:00"));
        assertThat(yesterday.periodEnd()).isEqualTo(LocalDateTime.parse("2026-10-12T00:00:00"));
        assertThat(yesterday.ranks().getFirst().registered()).isEqualTo(1);
        assertThat(service.users("TIMO","ID","yesterday","INVITER",1L,null,0,20).items())
                .extracting(OperationsDashboardService.User::userId).containsExactly(4L);
        for(String period:new String[]{"7","30"}) {
            var report=service.report("TIMO","ID",30,period);
            assertThat(report.ranks().getFirst().registered()).isEqualTo(4);
            assertThat(service.users("TIMO","ID",period,"INVITER",1L,null,0,20).total()).isEqualTo(4);
        }
        assertThat(service.users("TIMO","ID","today","REGISTERED",null,"2026-10-11",0,20).items())
                .extracting(OperationsDashboardService.User::userId).containsExactly(4L);
        assertThat(service.users("TIMO","BR","today","REGISTERED",null,null,0,20).items())
                .extracting(OperationsDashboardService.User::userId).containsExactly(8L);
    }
    private static Clock fixed(){return Clock.fixed(Instant.parse("2026-10-12T09:00:00Z"),ZoneOffset.UTC);}
    private static final class MutableClock extends Clock {Instant at;MutableClock(Instant at){this.at=at;}public ZoneId getZone(){return ZoneOffset.UTC;}public Clock withZone(ZoneId zone){return this;}public Instant instant(){return at;}}
    private static void seed(JdbcTemplate db){
        db.update("INSERT INTO user_distribution_profile VALUES(1,'ID','2026-09-01'),(2,'ID','2026-10-12 01:00:00'),(3,'ID','2026-10-12 02:00:00'),(4,'ID','2026-10-11 23:00:00'),(5,'ID','2026-10-12 03:00:00'),(6,'ID','2026-10-12 08:00:00'),(7,'ID','2026-10-10'),(8,'BR','2026-10-12 08:00:00'),(9,'ID','2026-10-12 09:00:00')");
        db.update("INSERT INTO invitation_relation_version VALUES(2,1,1,'INVITE_CODE'),(3,1,1,'INVITE_CODE'),(5,1,1,'INVITE_CODE')");
        db.update("INSERT INTO user_public_profile VALUES(1,'Inviter')");
        db.update("INSERT INTO platform_account_binding VALUES(2,2,'TIMO','VERIFIED','MCN_TIMO','2026-10-12 01:00:00'),(3,3,'TIMO','VERIFIED','MCN_TIMO','2026-10-12 02:00:00'),(4,4,'TIMO','VERIFIED','MCN_TIMO','2026-10-11 23:00:00'),(5,5,'TIMO','REJECTED','MCN_TIMO','2026-10-12 03:00:00'),(6,6,'TIMO','VERIFYING','MCN_TIMO','2026-10-12 08:00:00'),(7,7,'TIMO','VERIFYING','MCN_TIMO','2026-10-10')");
        db.update("INSERT INTO platform_binding_history VALUES(1,2,2,'TIMO','VERIFYING','VERIFIED','MCN_TIMO','2026-10-12 01:30:00'),(2,3,3,'TIMO','VERIFYING','VERIFIED','MCN_TIMO','2026-10-12 02:30:00'),(3,4,4,'TIMO','VERIFYING','VERIFIED','MCN_TIMO','2026-10-12 03:00:00')");
        db.update("INSERT INTO linky_account_binding VALUES(1,3,'ELIGIBLE','MATCHED_OURS','2026-10-12 02:00:00')");
        db.update("INSERT INTO linky_verification_attempt VALUES(1,3,'FOUND','IN_EXPECTED_GUILD','MCN','2026-10-12 02:30:00')");
    }
    private static JdbcTemplate database(){
        JdbcTemplate db=new JdbcTemplate(new DriverManagerDataSource("jdbc:h2:mem:ops_dashboard_"+System.nanoTime()+";MODE=MySQL;DB_CLOSE_DELAY=-1","sa",""));
        db.execute("CREATE TABLE user_distribution_profile(user_id BIGINT PRIMARY KEY,country_code VARCHAR(10),registered_at TIMESTAMP)");
        db.execute("CREATE TABLE invitation_relation_version(user_id BIGINT,inviter_user_id BIGINT,version_no INT,source_type VARCHAR(40))");
        db.execute("CREATE TABLE platform_account_binding(id BIGINT,user_id BIGINT,platform_code VARCHAR(32),binding_status VARCHAR(32),verification_source VARCHAR(32),submitted_at TIMESTAMP)");
        db.execute("CREATE TABLE platform_binding_history(id BIGINT,binding_id BIGINT,user_id BIGINT,platform_code VARCHAR(32),from_status VARCHAR(32),to_status VARCHAR(32),source_system VARCHAR(32),occurred_at TIMESTAMP)");
        db.execute("CREATE TABLE linky_account_binding(id BIGINT,user_id BIGINT,registration_eligibility VARCHAR(32),guild_check_status VARCHAR(32),created_at TIMESTAMP)");
        db.execute("CREATE TABLE linky_verification_attempt(id BIGINT,user_id BIGINT,result_status VARCHAR(32),membership_status VARCHAR(64),verification_source VARCHAR(32),attempted_at TIMESTAMP)");
        db.execute("CREATE TABLE user_operations_profile(user_id BIGINT,operator_admin_id BIGINT)");
        db.execute("CREATE TABLE user_public_profile(user_id BIGINT,nickname VARCHAR(40))");
        db.execute("CREATE TABLE admin_account(id BIGINT,display_name VARCHAR(40))");return db;
    }
}
