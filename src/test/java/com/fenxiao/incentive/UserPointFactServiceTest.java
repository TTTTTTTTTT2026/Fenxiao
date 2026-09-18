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
        // Several historical tests share one H2 context. Add only the columns this fixture
        // needs; never drop or replace their tables.
        jdbc.execute("create table if not exists mcn_income_raw_ledger_event (id bigint auto_increment primary key,occurred_at timestamp)");
        for (String column : new String[]{"source_system varchar(32)", "delivery_id varchar(128)", "platform_code varchar(32)", "source_event_id varchar(128)", "source_revision varchar(512)", "platform_user_id varchar(64)", "resolution_status varchar(32)", "resolution_reason varchar(96)", "fact_granularity varchar(32)", "event_type varchar(32)", "settlement_status varchar(32)", "amount decimal(18,6)", "currency_code varchar(16)", "amount_unit varchar(32)", "business_date date", "source_timezone varchar(64)", "period_start timestamp", "period_end timestamp", "source_updated_at timestamp", "payload_hash varchar(64)", "source_payload varchar(4096)", "received_at timestamp", "settlement_basis varchar(64)", "created_at timestamp", "updated_at timestamp"}) jdbc.execute("alter table mcn_income_raw_ledger_event add column if not exists " + column);
        jdbc.execute("create table if not exists mcn_income_shadow_ledger_projection (id bigint auto_increment primary key,raw_ledger_event_id bigint,platform_code varchar(32),shadow_status varchar(32))");
        for (String column : new String[]{"source_system varchar(32)", "source_event_id varchar(128)", "source_revision varchar(512)", "resolved_user_id bigint", "business_date date", "settlement_status varchar(32)", "event_type varchar(32)", "amount decimal(18,6)", "amount_unit varchar(32)", "currency_code varchar(16)", "source_updated_at timestamp", "projected_at timestamp"}) jdbc.execute("alter table mcn_income_shadow_ledger_projection add column if not exists " + column);
        jdbc.execute("create table if not exists invitation_relation_version (id bigint auto_increment primary key,user_id bigint,inviter_user_id bigint,version_no int,effective_from timestamp,effective_to timestamp)");
        for (String column : new String[]{"change_reason varchar(255)", "source_type varchar(32)", "source_reference varchar(128)", "operated_by bigint", "created_at timestamp", "updated_at timestamp"}) jdbc.execute("alter table invitation_relation_version add column if not exists " + column);
        jdbc.execute("create table if not exists token_point_conversion_version (id bigint auto_increment primary key,conversion_code varchar(64),conversion_version int,platform_code varchar(32),token_unit varchar(32),points_per_token decimal(18,6),effective_from timestamp,effective_to timestamp,rule_status varchar(16),created_by bigint)");
        jdbc.execute("create table if not exists user_direct_invitee_point_fact (id bigint auto_increment primary key,source_system varchar(32),platform_code varchar(32),source_event_id varchar(128),raw_ledger_event_id bigint,source_revision varchar(512),source_user_id bigint,beneficiary_user_id bigint,invitation_version_no int,conversion_id bigint,token_unit varchar(32),source_amount decimal(18,6),points_per_token decimal(18,6),point_amount decimal(18,6),occurred_at timestamp,fact_status varchar(32),decision_reason varchar(255),projected_at timestamp)");
        jdbc.execute("create table if not exists user_point_balance_projection (user_id bigint primary key,total_points decimal(18,6),accrued_fact_count int,latest_income_at timestamp,evaluated_at timestamp)");
        jdbc.update("delete from user_direct_invitee_point_fact where source_event_id='POINT-FACT-EVENT-A'");
        jdbc.update("delete from user_point_balance_projection where user_id=9100");
        jdbc.update("delete from mcn_income_shadow_ledger_projection where source_event_id='POINT-FACT-EVENT-A'");
        jdbc.update("delete from invitation_relation_version where user_id=9200");
        jdbc.update("delete from token_point_conversion_version where conversion_code like 'POINT-FACT-%'");
    }

    @Test
    void accruesOnlyDirectInviteeBoundFinalIncomeWithSnapshotsAndRevocation() {
        LocalDateTime incomeAt = LocalDateTime.now(Clock.systemUTC()).minusDays(2).withNano(0);
        jdbc.update("insert into invitation_relation_version(user_id,inviter_user_id,version_no,effective_from,change_reason,source_type,created_at,updated_at) values(?,?,?,?,?,?,current_timestamp,current_timestamp)", 9200L, 9100L, 1, incomeAt.minusDays(1), "point-fact-test", "TEST");
        jdbc.update("insert into token_point_conversion_version(conversion_code,conversion_version,platform_code,token_unit,points_per_token,effective_from,rule_status) values(?,?,?,?,?,?,'ACTIVE')", "POINT-FACT-LINKY", 1, "LINKY", "LINKY_DIAMOND", new BigDecimal("0.200000"), incomeAt.minusDays(1));
        addIncome(9200L, incomeAt, new BigDecimal("5.000000"), "POINT-FACT-EVENT-A", "revision-a");

        assertThat(points.refresh("LINKY")).isEqualTo(1);
        var accrued = points.dashboard("LINKY", 10);
        assertThat(accrued.accruedFactCount()).isEqualTo(1);
        assertThat(accrued.accruedPointTotal()).isEqualByComparingTo("1.000000");
        assertThat(accrued.recentFacts().getFirst().beneficiaryUserId()).isEqualTo(9100L);
        assertThat(accrued.recentFacts().getFirst().invitationVersionNo()).isEqualTo(1);
        assertThat(accrued.recentFacts().getFirst().factStatus()).isEqualTo("ACCRUED");
        assertThat(accrued.topBalances().getFirst().userId()).isEqualTo(9100L);

        jdbc.update("update token_point_conversion_version set rule_status='RETIRED',effective_to=? where conversion_code='POINT-FACT-LINKY'", incomeAt.plusDays(1));
        jdbc.update("insert into token_point_conversion_version(conversion_code,conversion_version,platform_code,token_unit,points_per_token,effective_from,rule_status) values(?,?,?,?,?,?,'ACTIVE')", "POINT-FACT-LINKY-NEXT", 1, "LINKY", "LINKY_DIAMOND", new BigDecimal("9.000000"), incomeAt.plusDays(1));
        assertThat(points.refresh("LINKY")).isEqualTo(1);
        assertThat(points.dashboard("LINKY", 10).recentFacts().getFirst().pointAmount()).isEqualByComparingTo("1.000000");

        jdbc.update("delete from mcn_income_shadow_ledger_projection where source_event_id='POINT-FACT-EVENT-A'");
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
