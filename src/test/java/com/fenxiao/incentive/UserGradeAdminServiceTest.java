package com.fenxiao.incentive;

import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.distribution.domain.DistributionRole;
import com.fenxiao.distribution.service.DistributionBindingService;
import com.fenxiao.incentive.dto.UserGradeRuleRequest;
import com.fenxiao.incentive.service.UserGradeAdminService;
import com.fenxiao.platform.dto.VerifyPlatformBindingRequest;
import com.fenxiao.platform.service.PlatformLifecycleService;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
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
class UserGradeAdminServiceTest {
    @Autowired UserGradeAdminService grades;
    @Autowired DistributionBindingService bindingService;
    @Autowired PlatformLifecycleService lifecycleService;
    @Autowired UserDistributionProfileRepository profiles;
    @Autowired JdbcTemplate jdbc;

    @BeforeEach
    void createGradeTables() {
        jdbc.execute("create table if not exists mcn_income_raw_ledger_event (id bigint auto_increment primary key,occurred_at timestamp not null)");
        jdbc.execute("create table if not exists mcn_income_shadow_ledger_projection (id bigint auto_increment primary key,raw_ledger_event_id bigint not null,platform_code varchar(32) not null,guild_id varchar(64),resolved_user_id bigint,amount decimal(18,6) not null,shadow_status varchar(32) not null)");
        jdbc.execute("create table if not exists user_grade_rule_version (id bigint auto_increment primary key,rule_code varchar(64) not null,rule_version int not null,grade_code varchar(32) not null,platform_code varchar(32) not null,country_code varchar(10) not null,guild_id varchar(64),required_direct_invite_count int not null,required_direct_income decimal(18,6) not null,effective_from timestamp not null,effective_to timestamp,rule_status varchar(16) not null,created_by bigint,approved_by bigint,approved_at timestamp,approval_note varchar(255),created_at timestamp default current_timestamp,updated_at timestamp default current_timestamp)");
        jdbc.execute("create table if not exists user_grade_evaluation (id bigint auto_increment primary key,user_id bigint not null,platform_code varchar(32) not null,guild_id varchar(64) not null,grade_code varchar(32) not null,rule_id bigint not null,qualification_status varchar(32) not null,direct_invite_count int not null,direct_income decimal(18,6) not null,qualified_at timestamp,evaluated_at timestamp not null,created_at timestamp default current_timestamp,updated_at timestamp default current_timestamp, unique(user_id,platform_code,guild_id,grade_code))");
    }

    @Test
    void shouldPromoteOnlyFromDirectInviteMetricsAndNeverAutoDowngrade() {
        LocalDateTime now = LocalDateTime.now(Clock.systemUTC()).withNano(0);
        var finance = new AdminSessionService.AdminPrincipal(8001L, "finance", "Finance", "finance", false, 1L, false, now.plusHours(1), "*", "*", "*");
        var draft = grades.createDraft(new UserGradeRuleRequest("TEAM_LEADER", "LINKY", "BR", null, 1, BigDecimal.ZERO, now.minusMinutes(1), null), finance);
        grades.activate(draft.id(), "direct-invite rule reviewed", finance);

        var leader = bindingService.createProfile(76100L, "BR", "pt-br", null);
        var child = bindingService.createProfile(76101L, "BR", "pt-br", leader.getInviteCode());
        lifecycleService.submit(leader.getUserId(), "LINKY", "76100001");
        lifecycleService.verify(new VerifyPlatformBindingRequest("LINKY", "76100001", false, true, "BR_GRADE_1", now, "TEST", "leader"));
        lifecycleService.submit(child.getUserId(), "LINKY", "76100002");
        lifecycleService.verify(new VerifyPlatformBindingRequest("LINKY", "76100002", false, true, "BR_GRADE_1", now, "TEST", "child"));

        var result = grades.evaluate(leader.getUserId(), "LINKY");
        assertThat(result).singleElement().satisfies(value -> {
            assertThat(value.gradeCode()).isEqualTo("TEAM_LEADER");
            assertThat(value.status()).isEqualTo("QUALIFIED");
            assertThat(value.directInviteCount()).isEqualTo(1);
        });
        assertThat(profiles.findById(leader.getUserId()).orElseThrow().getDistributionRole()).isEqualTo(DistributionRole.TEAM_LEADER);

        jdbc.update("update invitation_relation_version set effective_to=? where user_id=? and effective_to is null", now.minusMinutes(1), child.getUserId());
        assertThat(grades.evaluate(leader.getUserId(), "LINKY")).singleElement().satisfies(value -> assertThat(value.status()).isEqualTo("QUALIFIED"));
    }
}
