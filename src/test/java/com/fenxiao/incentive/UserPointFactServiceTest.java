package com.fenxiao.incentive;

import com.fenxiao.incentive.service.UserPointFactService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@ActiveProfiles("test")
@SpringBootTest
class UserPointFactServiceTest {
    @Autowired UserPointFactService points;
    @Autowired JdbcTemplate jdbc;

    @BeforeEach
    void tables() {
        jdbc.execute("drop table if exists mcn_income_shadow_ledger_projection");
        jdbc.execute("drop table if exists mcn_income_raw_ledger_event");
        jdbc.execute("drop table if exists invitation_relation_version");
        jdbc.execute("drop table if exists token_point_conversion_version");
        jdbc.execute("drop table if exists user_direct_invitee_point_fact");
        jdbc.execute("drop table if exists user_point_balance_projection");
        jdbc.execute("create table mcn_income_raw_ledger_event (id bigint auto_increment primary key,source_system varchar(32) not null,delivery_id varchar(128) not null,platform_code varchar(32) not null,source_event_id varchar(128) not null,source_revision varchar(512) not null,original_source_event_id varchar(128),platform_user_id varchar(64) not null,resolved_user_id bigint,resolution_status varchar(32) not null,resolution_reason varchar(96) not null,fact_granularity varchar(32),event_type varchar(32) not null,settlement_status varchar(32) not null,amount decimal(18,6) not null,currency_code varchar(16) not null,amount_unit varchar(32),business_date date,source_timezone varchar(64),period_start timestamp,period_end timestamp,occurred_at timestamp not null,settled_at timestamp,source_updated_at timestamp not null,guild_id varchar(64),payload_hash varchar(64) not null,source_payload varchar(4096) not null,received_at timestamp not null,settlement_basis varchar(64),created_at timestamp not null,updated_at timestamp not null)");
        jdbc.execute("create table mcn_income_shadow_ledger_projection (id bigint auto_increment primary key,source_system varchar(32) not null,platform_code varchar(32) not null,source_event_id varchar(128) not null,raw_ledger_event_id bigint not null,source_revision varchar(512) not null,business_date date not null,guild_id varchar(64),resolved_user_id bigint,settlement_status varchar(32) not null,event_type varchar(32) not null,amount decimal(18,6) not null,amount_unit varchar(32) not null,currency_code varchar(16) not null,shadow_status varchar(32) not null,source_updated_at timestamp not null,projected_at timestamp not null,unique(source_system,platform_code,source_event_id))");
        jdbc.execute("create table invitation_relation_version (id bigint auto_increment primary key,user_id bigint not null,inviter_user_id bigint,version_no int not null,effective_from timestamp not null,effective_to timestamp,change_reason varchar(255) not null,source_type varchar(32) not null,source_reference varchar(128),operated_by bigint,created_at timestamp not null,updated_at timestamp not null)");
        jdbc.execute("create table token_point_conversion_version (id bigint auto_increment primary key,platform_code varchar(32) not null,points_per_token decimal(18,6) not null,effective_from timestamp not null,effective_to timestamp,rule_status varchar(16) not null)");
        jdbc.execute("create table user_direct_invitee_point_fact (id bigint auto_increment primary key,source_system varchar(32) not null,platform_code varchar(32) not null,source_event_id varchar(128) not null,raw_ledger_event_id bigint not null,source_revision varchar(512) not null,source_user_id bigint not null,beneficiary_user_id bigint,invitation_version_no int,conversion_id bigint,token_unit varchar(32) not null,source_amount decimal(18,6) not null,points_per_token decimal(18,6),point_amount decimal(18,6),occurred_at timestamp not null,fact_status varchar(32) not null,decision_reason varchar(255) not null,projected_at timestamp not null,unique(source_system,platform_code,source_event_id))");
        jdbc.execute("create table user_point_balance_projection (user_id bigint primary key,total_points decimal(18,6) not null,accrued_fact_count int not null,latest_income_at timestamp,evaluated_at timestamp not null)");
    }

    @Test
    void accruesOnlyDirectInviteeBoundFinalIncomeWithSnapshotsAndRevocation() {
        LocalDateTime incomeAt = LocalDateTime.now(Clock.systemUTC()).minusDays(2).withNano(0);
        jdbc.update("insert into invitation_relation_version(user_id,inviter_user_id,version_no,effective_from,change_reason,source_type,created_at,updated_at) values(?,?,?,?,?,?,?,?)", 200L, 100L, 1, incomeAt.minusDays(1), "test", "TEST", incomeAt.minusDays(1), incomeAt.minusDays(1));
        jdbc.update("insert into token_point_conversion_version(platform_code,points_per_token,effective_from,rule_status) values(?,?,?,'ACTIVE')", "LINKY", new BigDecimal("0.200000"), incomeAt.minusDays(1));
        addIncome(200L, incomeAt, new BigDecimal("5.000000"), "event-a", "revision-a");

        assertThat(points.refresh("LINKY")).isEqualTo(1);
        var accrued = points.dashboard("LINKY", 10);
        assertThat(accrued.accruedFactCount()).isEqualTo(1);
        assertThat(accrued.accruedPointTotal()).isEqualByComparingTo("1.000000");
        assertThat(accrued.recentFacts().getFirst().beneficiaryUserId()).isEqualTo(100L);
        assertThat(accrued.recentFacts().getFirst().invitationVersionNo()).isEqualTo(1);
        assertThat(accrued.recentFacts().getFirst().factStatus()).isEqualTo("ACCRUED");
        assertThat(accrued.topBalances().getFirst().userId()).isEqualTo(100L);

        jdbc.update("update token_point_conversion_version set rule_status='RETIRED',effective_to=?", incomeAt.plusDays(1));
        jdbc.update("insert into token_point_conversion_version(platform_code,points_per_token,effective_from,rule_status) values(?,?,?,'ACTIVE')", "LINKY", new BigDecimal("9.000000"), incomeAt.plusDays(1));
        assertThat(points.refresh("LINKY")).isEqualTo(1);
        assertThat(points.dashboard("LINKY", 10).recentFacts().getFirst().pointAmount()).isEqualByComparingTo("1.000000");

        jdbc.update("delete from mcn_income_shadow_ledger_projection");
        assertThat(points.refresh("LINKY")).isZero();
        var revoked = points.dashboard("LINKY", 10);
        assertThat(revoked.revokedFactCount()).isEqualTo(1);
        assertThat(revoked.topBalances().getFirst().totalPoints()).isEqualByComparingTo("0.000000");
    }

    private void addIncome(long userId, LocalDateTime occurredAt, BigDecimal amount, String eventId, String revision) {
        jdbc.update("insert into mcn_income_raw_ledger_event(source_system,delivery_id,platform_code,source_event_id,source_revision,platform_user_id,resolution_status,resolution_reason,fact_granularity,event_type,settlement_status,amount,currency_code,amount_unit,business_date,source_timezone,period_start,period_end,occurred_at,source_updated_at,payload_hash,source_payload,received_at,settlement_basis,created_at,updated_at) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                "MCN", "delivery-" + eventId, "LINKY", eventId, revision, "platform-" + userId, "BOUND", "test", "DAILY", "INCOME", "SETTLED", amount, "XXX", "LINKY_DIAMOND", occurredAt.toLocalDate(), "UTC", occurredAt.minusHours(1), occurredAt, occurredAt, occurredAt, "hash-" + eventId, "{}", occurredAt, "SETTLED", occurredAt, occurredAt);
        Long rawId = jdbc.queryForObject("select max(id) from mcn_income_raw_ledger_event", Long.class);
        jdbc.update("insert into mcn_income_shadow_ledger_projection(source_system,platform_code,source_event_id,raw_ledger_event_id,source_revision,business_date,resolved_user_id,settlement_status,event_type,amount,amount_unit,currency_code,shadow_status,source_updated_at,projected_at) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                "MCN_INCOME_V1", "LINKY", eventId, rawId, revision, occurredAt.toLocalDate(), userId, "SETTLED", "INCOME", amount, "LINKY_DIAMOND", "XXX", "BOUND_FINAL", occurredAt, occurredAt);
    }
}
