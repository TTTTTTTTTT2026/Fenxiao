package com.fenxiao.incentive;

import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.incentive.dto.UserGradeAdvancementReviewRequest;
import com.fenxiao.incentive.service.UserGradeAdvancementReviewService;
import com.fenxiao.user.entity.UserDistributionProfile;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@ActiveProfiles("test")
@SpringBootTest
class UserGradeAdvancementReviewServiceTest {
    @Autowired UserGradeAdvancementReviewService reviews;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserDistributionProfileRepository users;

    @BeforeEach
    void table() {
        jdbc.execute("drop table if exists user_grade_advancement_review");
        jdbc.execute("create table user_grade_advancement_review (id bigint auto_increment primary key,user_id bigint not null,platform_code varchar(32) not null,guild_id varchar(64) not null,target_grade_code varchar(32) not null,training_status varchar(32) not null default 'PENDING',training_note varchar(512),training_verified_by bigint,training_verified_at timestamp,operating_validation_status varchar(32) not null default 'PENDING',operating_validation_note varchar(512),operating_verified_by bigint,operating_verified_at timestamp,responsibility_status varchar(32) not null default 'NOT_CONFIRMED',responsibility_note varchar(512),responsibility_confirmed_by bigint,responsibility_confirmed_at timestamp,review_status varchar(32) not null default 'OPEN',created_by bigint,created_at timestamp not null default current_timestamp,updated_at timestamp not null default current_timestamp,unique(user_id,platform_code,guild_id,target_grade_code))");
    }

    @Test
    void recordsEachAdvancedGradeGateWithoutChangingTeamOrRewardState() {
        users.save(UserDistributionProfile.create(200L, "BR", "pt", "ADV-200"));
        jdbc.update("insert into user_grade_evaluation(user_id,platform_code,guild_id,grade_code,rule_id,qualification_status,direct_invite_count,direct_income,qualified_at,evaluated_at) values(200,'LINKY','guild-1','GOLD',1,'QUALIFIED',30,0,current_timestamp,current_timestamp)");
        var actor = new AdminSessionService.AdminPrincipal(11L, "team_admin", "Team", "team", false, 1L, false, LocalDateTime.now().plusHours(1), "*", "*", "*");
        var opened = reviews.open(new UserGradeAdvancementReviewRequest(200L, "LINKY", "guild-1", "PLATINUM"), actor);
        assertThat(opened.trainingStatus()).isEqualTo("PENDING");

        var trained = reviews.confirmTraining(opened.id(), "two silver members accepted for cultivation", actor);
        var operated = reviews.confirmOperatingValidation(opened.id(), "30-day group observation evidence reviewed", actor);
        var confirmed = reviews.confirmResponsibility(opened.id(), "operating responsibility confirmed", actor);
        var appointed = reviews.confirmLeadershipAppointment(opened.id(), "formal leadership appointment approved", actor);

        assertThat(trained.trainingStatus()).isEqualTo("CONFIRMED");
        assertThat(operated.operatingValidationStatus()).isEqualTo("CONFIRMED");
        assertThat(confirmed.responsibilityStatus()).isEqualTo("CONFIRMED");
        assertThat(confirmed.reviewStatus()).isEqualTo("READY_FOR_LEADER_CONFIRMATION");
        assertThat(appointed.reviewStatus()).isEqualTo("LEADER_CONFIRMED");
        assertThat(jdbc.queryForObject("select leader_appointment_status from operating_team where leader_user_id=200", String.class)).isEqualTo("CONFIRMED");
        assertThat(reviews.recent()).hasSize(1);
    }
}
