package com.fenxiao.incentive;

import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.incentive.dto.EffectiveUserCorrectionRequest;
import com.fenxiao.incentive.service.EffectiveUserQualificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.time.Clock;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@ActiveProfiles("test")
@SpringBootTest
class EffectiveUserQualificationServiceTest {
    @Autowired EffectiveUserQualificationService effectiveUsers;
    @Autowired JdbcTemplate jdbc;

    @BeforeEach
    void tables() {
        jdbc.execute("drop table if exists mcn_income_shadow_ledger_projection");
        jdbc.execute("create table if not exists mcn_income_raw_ledger_event (id bigint auto_increment primary key,occurred_at timestamp not null)");
        jdbc.execute("create table mcn_income_shadow_ledger_projection (id bigint auto_increment primary key,raw_ledger_event_id bigint not null,platform_code varchar(32) not null,resolved_user_id bigint,shadow_status varchar(32) not null,business_date date not null,settlement_status varchar(32) not null,event_type varchar(32) not null)");
        jdbc.execute("create table if not exists invitation_relation_version (id bigint auto_increment primary key,user_id bigint not null,inviter_user_id bigint,effective_from timestamp not null,effective_to timestamp)");
        jdbc.execute("create table if not exists user_grade_evaluation (id bigint auto_increment primary key,user_id bigint not null,platform_code varchar(32) not null,guild_id varchar(64),grade_code varchar(32),rule_id bigint,qualification_status varchar(32) not null,direct_invite_count int,direct_income decimal(18,6),qualified_at timestamp,evaluated_at timestamp not null)");
        // The shared in-memory context can create this projection from either the
        // effective-user or grade-admin fixture. Keep the common schema additive.
        for (String column : new String[]{"guild_id varchar(64)", "grade_code varchar(32)", "rule_id bigint", "direct_invite_count int", "direct_income decimal(18,6)", "qualified_at timestamp"}) {
            jdbc.execute("alter table user_grade_evaluation add column if not exists " + column);
        }
        jdbc.execute("create table if not exists effective_user_qualification_fact (id bigint auto_increment primary key,user_id bigint not null,platform_code varchar(32) not null,qualification_status varchar(32) not null,first_income_at timestamp,observation_ends_at timestamp,qualifying_income_date_count int not null default 0,qualifying_income_dates varchar(255),latest_income_at timestamp,source_evidence_snapshot varchar(1024),qualified_at timestamp,evidence_revoked_at timestamp,manual_correction_reason varchar(32),manual_correction_note varchar(255),corrected_by bigint,corrected_at timestamp,evaluated_at timestamp not null,qualification_window_start date,qualification_window_end date,current_activity_status varchar(32) not null default 'NOT_ACTIVE',current_activity_window_start date,current_activity_window_end date,unique(user_id,platform_code))");
        jdbc.execute("delete from effective_user_qualification_fact");
    }

    @Test
    void recordsSevenDayThreeDateEvidenceAndAllowsOnlyAuditedManualExclusion() {
        LocalDateTime first = LocalDateTime.now(Clock.systemUTC()).minusDays(10).withHour(9).withMinute(0).withSecond(0).withNano(0);
        addIncome(200L, first, "e-1", "r-1");
        addIncome(200L, first.plusDays(2), "e-2", "r-2");
        addIncome(200L, first.plusDays(6), "e-3", "r-3");
        jdbc.update("insert into invitation_relation_version(user_id,inviter_user_id,version_no,effective_from,change_reason,source_type,created_at,updated_at) values(?,?,?,?,?,?,?,?)", 200L, 100L, 1, first.minusDays(1), "test", "TEST", first.minusDays(1), first.minusDays(1));

        assertThat(effectiveUsers.refreshPlatform("LINKY")).isEqualTo(1);
        var fact = effectiveUsers.recent("LINKY", 10).getFirst();
        assertThat(fact.qualificationStatus()).isEqualTo("QUALIFIED");
        assertThat(fact.qualifyingIncomeDateCount()).isEqualTo(3);
        assertThat(effectiveUsers.qualifiedDirectInviteCount(100L, "LINKY", LocalDateTime.now(Clock.systemUTC()))).isEqualTo(1);

        jdbc.update("delete from mcn_income_shadow_ledger_projection where resolved_user_id=?", 200L);
        assertThat(effectiveUsers.refreshPlatform("LINKY")).isEqualTo(1);
        assertThat(effectiveUsers.recent("LINKY", 10).getFirst().qualificationStatus()).isEqualTo("EVIDENCE_REVOKED");
        assertThat(effectiveUsers.qualifiedDirectInviteCount(100L, "LINKY", LocalDateTime.now(Clock.systemUTC()))).isZero();

        LocalDateTime now = LocalDateTime.now(Clock.systemUTC());
        var finance = new AdminSessionService.AdminPrincipal(8001L, "finance", "Finance", "finance", false, 1L, false, now.plusHours(1), "*", "*", "*");
        var excluded = effectiveUsers.exclude(new EffectiveUserCorrectionRequest(200L, "LINKY", "FAKE_INCOME", "confirmed fake income evidence"), finance);
        assertThat(excluded.qualificationStatus()).isEqualTo("MANUALLY_EXCLUDED");
        assertThat(effectiveUsers.qualifiedDirectInviteCount(100L, "LINKY", now)).isZero();
    }

    @Test
    void qualifiesWhenTheRecentCompleteNaturalDayWindowMeetsTheRuleEvenIfTheFirstIncomeWindowDidNot() {
        LocalDateTime now = LocalDateTime.now(Clock.systemUTC()).withHour(9).withMinute(0).withSecond(0).withNano(0);
        addIncome(201L, now.minusDays(20), "first", "r-1");
        addIncome(201L, now.minusDays(6), "recent-1", "r-2");
        addIncome(201L, now.minusDays(4), "recent-2", "r-3");
        addIncome(201L, now.minusDays(1), "recent-3", "r-4");

        assertThat(effectiveUsers.refreshPlatform("LINKY")).isEqualTo(1);
        var fact = effectiveUsers.recent("LINKY", 10).getFirst();

        assertThat(fact.qualificationStatus()).isEqualTo("QUALIFIED");
        assertThat(fact.qualifyingIncomeDateCount()).isEqualTo(3);
        assertThat(fact.currentActivityStatus()).isEqualTo("ACTIVE");
        assertThat(fact.currentActivityWindowStart()).isEqualTo(now.toLocalDate().minusDays(7));
        assertThat(fact.currentActivityWindowEnd()).isEqualTo(now.toLocalDate());
    }

    @Test
    void doesNotCountTodayAsACompleteNaturalDay() {
        LocalDateTime now = LocalDateTime.now(Clock.systemUTC()).withHour(9).withMinute(0).withSecond(0).withNano(0);
        addIncome(202L, now.minusDays(6), "complete-1", "r-1");
        addIncome(202L, now.minusDays(2), "complete-2", "r-2");
        addIncome(202L, now, "today", "r-3");

        effectiveUsers.refreshPlatform("LINKY");
        var fact = effectiveUsers.recent("LINKY", 10).getFirst();

        assertThat(fact.qualificationStatus()).isEqualTo("NOT_QUALIFIED");
        assertThat(fact.currentActivityStatus()).isEqualTo("NOT_ACTIVE");
    }

    private void addIncome(long userId, LocalDateTime occurredAt, String event, String revision) {
        jdbc.update("insert into mcn_income_raw_ledger_event(source_system,delivery_id,platform_code,source_event_id,source_revision,platform_user_id,resolution_status,resolution_reason,fact_granularity,event_type,settlement_status,amount,currency_code,amount_unit,business_date,source_timezone,period_start,period_end,occurred_at,source_updated_at,payload_hash,source_payload,received_at,settlement_basis,created_at,updated_at) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                "MCN", "delivery-" + event, "LINKY", event, revision, "platform-" + userId, "BOUND", "test", "DAILY", "INCOME", "SETTLED", java.math.BigDecimal.ONE, "XXX", "LINKY_DIAMOND", occurredAt.toLocalDate(), "UTC", occurredAt.minusHours(1), occurredAt, occurredAt, occurredAt, "hash-" + event, "{}", occurredAt, "SETTLED", occurredAt, occurredAt);
        Long rawId = jdbc.queryForObject("select max(id) from mcn_income_raw_ledger_event", Long.class);
        jdbc.update("insert into mcn_income_shadow_ledger_projection(raw_ledger_event_id,platform_code,resolved_user_id,shadow_status,business_date,settlement_status,event_type) values(?,?,?,?,?,?,?)", rawId, "LINKY", userId, "BOUND_FINAL", occurredAt.toLocalDate(), "SETTLED", "INCOME");
    }
}
