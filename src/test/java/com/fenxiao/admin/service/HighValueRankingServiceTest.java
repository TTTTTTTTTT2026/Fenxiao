package com.fenxiao.admin.service;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class HighValueRankingServiceTest {
    @Test
    void ranksRealProjectionsByApplicationGuildAndHistoricalOwnership() {
        JdbcTemplate jdbc = database();
        jdbc.update("INSERT INTO user_distribution_profile VALUES (1,'ID'),(2,'ID'),(3,'ID'),(4,'BR')");
        jdbc.update("INSERT INTO user_public_profile VALUES (1,'A'),(2,'B')");
        jdbc.update("INSERT INTO user_operations_profile_change(user_id,field_name,new_value_code,changed_at) VALUES (1,'VALUE','HIGH_VALUE','2026-10-07 00:00:00'),(2,'VALUE','HIGH_VALUE','2026-10-07 00:00:00')");
        jdbc.update("INSERT INTO user_operations_profile_change(user_id,field_name,new_operator_admin_id,changed_at) VALUES (1,'OPERATOR',7,'2026-10-07 00:00:00'),(2,'OPERATOR',8,'2026-10-07 00:00:00')");
        jdbc.update("INSERT INTO invitation_relation_version VALUES (3,1,'2026-10-07 00:00:00',NULL)");
        jdbc.update("INSERT INTO invitation_commission_report_event VALUES (1,1,'LINKY','2026-10-08','2026-10-08','g1','2026-10-08 10:00:00',10),(2,1,'TIMO','2026-10-08','2026-10-08','g1','2026-10-08 10:00:00',500),(3,1,'LINKY','2026-10-08','2026-10-08','g2','2026-10-08 10:00:00',5)");
        jdbc.update("INSERT INTO mcn_income_raw_ledger_event VALUES (1,'2026-10-08 10:00:00'),(2,'2026-10-08 10:00:00')");
        jdbc.update("INSERT INTO mcn_income_shadow_ledger_projection VALUES (1,'MCN','LINKY','2026-10-08','g1',3,'SETTLED','INCOME',100,'LINKY_DIAMOND','BOUND_FINAL',1),(2,'MCN','TIMO','2026-10-08','g1',3,'SETTLED','INCOME',900,'TIMO_DIAMOND','BOUND_FINAL',2)");
        jdbc.update("INSERT INTO linky_verification_attempt VALUES (1,3,'FOUND','IN_EXPECTED_GUILD','g1','g1','2026-10-08 10:00:00'),(2,3,'FOUND','IN_EXPECTED_GUILD','g1','g1','2026-10-08 11:00:00')");
        jdbc.update("INSERT INTO mcn_income_shadow_ledger_run VALUES ('LINKY','2026-10-08')");
        HighValueRankingService service = service(jdbc);

        var report = service.report("LINKY", "g1", "ID", "day", "2026-10-08", 7L, "SELF_COMMISSION", 0, 20);
        assertThat(report.items()).hasSize(1);
        assertThat(report.items().getFirst().userId()).isEqualTo(1);
        assertThat(report.items().getFirst().selfCommission()).isEqualByComparingTo("10");
        assertThat(report.items().getFirst().directRawDiamonds()).isEqualByComparingTo("100");
        assertThat(report.items().getFirst().newInvitees()).isEqualTo(1);
        assertThat(report.coveredIncomeDays()).isEqualTo(1);
        assertThat(new HighValueRankingService(jdbc, Clock.fixed(Instant.parse("2026-10-15T00:00:00Z"), ZoneOffset.UTC))
                .report("LINKY", "g1", "ID", "week", "2026-W41", null,
                "NEW_INVITEES", 0, 20).items()).hasSize(2);

        // Reassignment and relabeling after period end cannot rewrite historical reports.
        jdbc.update("INSERT INTO user_operations_profile_change(user_id,field_name,new_operator_admin_id,changed_at) VALUES (1,'OPERATOR',8,'2026-10-09 12:00:00')");
        jdbc.update("INSERT INTO user_operations_profile_change(user_id,field_name,new_value_code,changed_at) VALUES (1,'VALUE','GENERAL','2026-10-09 12:00:00')");
        assertThat(service.report("LINKY", "g1", "ID", "day", "2026-10-08", 7L, "DIRECT_RAW_DIAMONDS", 0, 20).items()).hasSize(1);
        assertThat(service.report("LINKY", "g2", "ID", "day", "2026-10-08", 7L, "NEW_INVITEES", 0, 20).items().getFirst().newInvitees()).isZero();
        assertThat(service.report("LINKY", "g1", "BR", "day", "2026-10-08", null, "SELF_COMMISSION", 0, 20).items()).isEmpty();
        assertThat(service.report("LINKY", "g1", "ID", "day", "2026-10-08", 8L, "SELF_COMMISSION", 0, 20).items())
                .extracting(HighValueRankingService.Item::userId).containsExactly(2L);
    }

    @Test
    void rejectsUnfinishedAndCrossApplicationPeriods() {
        HighValueRankingService service = service(database());
        assertThatThrownBy(() -> service.report("ALL", null, "ID", "day", "2026-10-08", null, null, 0, 20))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.report("LINKY", null, "ID", "month", "2026-10", null, null, 0, 20))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> service.report("LINKY", null, "ID", "week", "2026-W54", null, null, 0, 20))
                .isInstanceOf(IllegalArgumentException.class);
    }

    private static HighValueRankingService service(JdbcTemplate jdbc) {
        return new HighValueRankingService(jdbc, Clock.fixed(Instant.parse("2026-10-09T14:00:00Z"), ZoneOffset.UTC));
    }

    private static JdbcTemplate database() {
        JdbcTemplate jdbc = new JdbcTemplate(new DriverManagerDataSource(
                "jdbc:h2:mem:high_value_" + System.nanoTime() + ";MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", ""));
        jdbc.execute("CREATE TABLE user_distribution_profile(user_id BIGINT PRIMARY KEY,country_code VARCHAR(10))");
        jdbc.execute("CREATE TABLE user_public_profile(user_id BIGINT PRIMARY KEY,nickname VARCHAR(40))");
        jdbc.execute("CREATE TABLE user_operations_profile_change(id BIGINT AUTO_INCREMENT PRIMARY KEY,user_id BIGINT,field_name VARCHAR(24),new_value_code VARCHAR(24),new_operator_admin_id BIGINT,changed_at TIMESTAMP)");
        jdbc.execute("CREATE TABLE invitation_relation_version(user_id BIGINT,inviter_user_id BIGINT,effective_from TIMESTAMP,effective_to TIMESTAMP)");
        jdbc.execute("CREATE TABLE invitation_commission_report_event(ledger_id BIGINT PRIMARY KEY,user_id BIGINT,platform_code VARCHAR(32),report_date DATE,business_date DATE,source_guild_id VARCHAR(64),occurred_at TIMESTAMP,points_delta DECIMAL(24,6))");
        jdbc.execute("CREATE TABLE mcn_income_raw_ledger_event(id BIGINT PRIMARY KEY,occurred_at TIMESTAMP)");
        jdbc.execute("CREATE TABLE mcn_income_shadow_ledger_projection(id BIGINT PRIMARY KEY,source_system VARCHAR(32),platform_code VARCHAR(32),business_date DATE,guild_id VARCHAR(64),resolved_user_id BIGINT,settlement_status VARCHAR(32),event_type VARCHAR(32),amount DECIMAL(18,6),amount_unit VARCHAR(32),shadow_status VARCHAR(32),raw_ledger_event_id BIGINT)");
        jdbc.execute("CREATE TABLE linky_verification_attempt(id BIGINT PRIMARY KEY,user_id BIGINT,result_status VARCHAR(32),membership_status VARCHAR(64),expected_guild_id VARCHAR(64),observed_guild_id VARCHAR(64),attempted_at TIMESTAMP)");
        jdbc.execute("CREATE TABLE platform_binding_history(id BIGINT PRIMARY KEY,binding_id BIGINT,user_id BIGINT,platform_code VARCHAR(32),to_status VARCHAR(32),occurred_at TIMESTAMP)");
        jdbc.execute("CREATE TABLE platform_verification_attempt(id BIGINT PRIMARY KEY,binding_id BIGINT,outcome VARCHAR(32),official_guild_id VARCHAR(64),attempted_at TIMESTAMP)");
        jdbc.execute("CREATE TABLE mcn_income_shadow_ledger_run(platform_code VARCHAR(32),business_date DATE)");
        return jdbc;
    }
}
