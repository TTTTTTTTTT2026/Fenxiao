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
import java.time.LocalDateTime;

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
}
