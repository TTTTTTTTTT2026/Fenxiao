package com.fenxiao.incentive;

import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.incentive.dto.UserGradeRuleRequest;
import com.fenxiao.incentive.service.UserGradeAdminService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ActiveProfiles("test")
@SpringBootTest
class UserGradeAdminServiceTest {
    @Autowired UserGradeAdminService grades;
    @Autowired JdbcTemplate jdbc;

    @BeforeEach
    void createGradeTables() {
        jdbc.execute("create table if not exists mcn_income_raw_ledger_event (id bigint auto_increment primary key,occurred_at timestamp not null)");
        jdbc.execute("create table if not exists mcn_income_shadow_ledger_projection (id bigint auto_increment primary key,raw_ledger_event_id bigint not null,platform_code varchar(32) not null,guild_id varchar(64),resolved_user_id bigint,amount decimal(18,6) not null,shadow_status varchar(32) not null)");
        for (String column : new String[]{"amount decimal(18,6)", "business_date date", "settlement_status varchar(32)", "event_type varchar(32)"}) jdbc.execute("alter table mcn_income_shadow_ledger_projection add column if not exists " + column);
        jdbc.execute("create table if not exists invitation_relation_version (id bigint auto_increment primary key,user_id bigint not null,inviter_user_id bigint,version_no int,effective_from timestamp not null,effective_to timestamp,change_reason varchar(255),source_type varchar(32),created_at timestamp,updated_at timestamp)");
        jdbc.execute("create table if not exists effective_user_qualification_fact (id bigint auto_increment primary key,user_id bigint not null,platform_code varchar(32) not null,qualification_status varchar(32) not null,evaluated_at timestamp,unique(user_id,platform_code))");
        for (String column : new String[]{"first_income_at timestamp", "observation_ends_at timestamp", "qualifying_income_date_count int default 0", "qualifying_income_dates varchar(255)", "latest_income_at timestamp", "source_evidence_snapshot varchar(1024)", "qualified_at timestamp", "evidence_revoked_at timestamp", "manual_correction_reason varchar(32)", "manual_correction_note varchar(255)", "corrected_by bigint", "corrected_at timestamp"}) {
            jdbc.execute("alter table effective_user_qualification_fact add column if not exists " + column);
        }
        jdbc.execute("create table if not exists user_grade_rule_version (id bigint auto_increment primary key,rule_code varchar(64) not null,rule_version int not null,grade_code varchar(32) not null,platform_code varchar(32) not null,country_code varchar(10) not null,guild_id varchar(64),required_direct_invite_count int not null,required_direct_income decimal(18,6) not null,effective_from timestamp not null,effective_to timestamp,rule_status varchar(16) not null,created_by bigint,approved_by bigint,approved_at timestamp,approval_note varchar(255),created_at timestamp default current_timestamp,updated_at timestamp default current_timestamp)");
        jdbc.execute("create table if not exists user_grade_evaluation (id bigint auto_increment primary key,user_id bigint not null,platform_code varchar(32) not null,guild_id varchar(64) not null,grade_code varchar(32) not null,rule_id bigint not null,qualification_status varchar(32) not null,direct_invite_count int not null,direct_income decimal(18,6) not null,qualified_at timestamp,evaluated_at timestamp not null,created_at timestamp default current_timestamp,updated_at timestamp default current_timestamp, unique(user_id,platform_code,guild_id,grade_code))");
    }

    @Test
    void shouldRejectTheRetiredLegacyTeamLeaderRule() {
        LocalDateTime now = LocalDateTime.now(Clock.systemUTC()).withNano(0);
        var finance = new AdminSessionService.AdminPrincipal(8001L, "finance", "Finance", "finance", false, 1L, false, now.plusHours(1), "*", "*", "*");
        assertThatThrownBy(() -> grades.createDraft(new UserGradeRuleRequest("TEAM_LEADER", "LINKY", "BR", null, 1, BigDecimal.ZERO, now.minusMinutes(1), null), finance))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("gradeCode");
    }

    @Test
    void shouldRequireAdvancedGradesToUseTheValidationWorkflow() {
        LocalDateTime now = LocalDateTime.now(Clock.systemUTC()).withNano(0);
        var operations = new AdminSessionService.AdminPrincipal(8002L, "operations", "Operations", "operations", false, 1L, false, now.plusHours(1), "*", "*", "*");
        assertThatThrownBy(() -> grades.createDraft(new UserGradeRuleRequest("PLATINUM", "LINKY", "BR", null, 0, BigDecimal.ZERO, now.minusMinutes(1), null), operations))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("training and operating validation");
    }

    @Test
    void shouldCountOnlyQualifiedDirectInviteesActiveOnThreeDatesInTheLastSevenCompleteDays() {
        LocalDateTime now = LocalDateTime.of(2026, 9, 18, 10, 0);
        jdbc.update("delete from mcn_income_shadow_ledger_projection where resolved_user_id in (401,402)");
        jdbc.update("delete from invitation_relation_version where user_id in (401,402)");
        jdbc.update("delete from effective_user_qualification_fact where user_id in (401,402)");
        jdbc.update("insert into invitation_relation_version(user_id,inviter_user_id,version_no,effective_from,change_reason,source_type,created_at,updated_at) values(401,400,1,?,'test','TEST',?,?)", now.minusDays(20), now, now);
        jdbc.update("insert into invitation_relation_version(user_id,inviter_user_id,version_no,effective_from,change_reason,source_type,created_at,updated_at) values(402,400,1,?,'test','TEST',?,?)", now.minusDays(20), now, now);
        jdbc.update("insert into effective_user_qualification_fact(user_id,platform_code,qualification_status,evaluated_at) values(401,'LINKY','QUALIFIED',?)", now);
        jdbc.update("insert into effective_user_qualification_fact(user_id,platform_code,qualification_status,evaluated_at) values(402,'LINKY','QUALIFIED',?)", now);
        addActiveIncome(401L, LocalDate.of(2026, 9, 11));
        addActiveIncome(401L, LocalDate.of(2026, 9, 12));
        addActiveIncome(401L, LocalDate.of(2026, 9, 17));
        addActiveIncome(402L, LocalDate.of(2026, 9, 10));
        addActiveIncome(402L, LocalDate.of(2026, 9, 11));
        addActiveIncome(402L, LocalDate.of(2026, 9, 18));

        assertThat(grades.currentActiveEffectiveInviteCount(400L, "LINKY", now)).isEqualTo(1);
    }

    private void addActiveIncome(long userId, LocalDate date) {
        jdbc.update("insert into mcn_income_shadow_ledger_projection(raw_ledger_event_id,platform_code,resolved_user_id,amount,shadow_status,business_date,settlement_status,event_type) values(1,'LINKY',?,1,'BOUND_FINAL',?,'SETTLED','INCOME')", userId, date);
    }
}
