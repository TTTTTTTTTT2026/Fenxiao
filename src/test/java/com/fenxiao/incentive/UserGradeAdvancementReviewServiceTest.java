package com.fenxiao.incentive;

import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.incentive.dto.UserGradeAdvancementReviewRequest;
import com.fenxiao.incentive.dto.UserGradePlatinumEvidenceRequest;
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
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ActiveProfiles("test")
@SpringBootTest
class UserGradeAdvancementReviewServiceTest {
    @Autowired UserGradeAdvancementReviewService reviews;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserDistributionProfileRepository users;

    @BeforeEach
    void table() {
        jdbc.execute("drop table if exists user_grade_advanced_training_evidence");
        jdbc.execute("drop table if exists user_grade_platinum_training_evidence");
        jdbc.execute("drop table if exists user_grade_advancement_review");
        jdbc.execute("create table if not exists user_grade_evaluation (id bigint auto_increment primary key,user_id bigint not null,platform_code varchar(32) not null,guild_id varchar(64) not null,grade_code varchar(32) not null,rule_id bigint not null,qualification_status varchar(32) not null,direct_invite_count int not null,direct_income decimal(18,6) not null,qualified_at timestamp,evaluated_at timestamp not null,unique(user_id,platform_code,guild_id,grade_code))");
        jdbc.execute("create table user_grade_advancement_review (id bigint auto_increment primary key,user_id bigint not null,platform_code varchar(32) not null,guild_id varchar(64) not null,target_grade_code varchar(32) not null,training_status varchar(32) not null default 'PENDING',training_note varchar(512),training_verified_by bigint,training_verified_at timestamp,operating_validation_status varchar(32) not null default 'PENDING',operating_validation_note varchar(512),operating_verified_by bigint,operating_verified_at timestamp,responsibility_status varchar(32) not null default 'NOT_CONFIRMED',responsibility_note varchar(512),responsibility_confirmed_by bigint,responsibility_confirmed_at timestamp,review_status varchar(32) not null default 'OPEN',created_by bigint,created_at timestamp not null default current_timestamp,updated_at timestamp not null default current_timestamp,unique(user_id,platform_code,guild_id,target_grade_code))");
        jdbc.execute("create table user_grade_platinum_training_evidence (id bigint auto_increment primary key,advancement_review_id bigint not null,trainee_user_id bigint not null,group_reference varchar(128) not null,observation_start date not null,observation_end date not null,final_week_effective_user_count int not null,final_week_min_income_date_count int not null,evidence_note varchar(1000) not null,evidence_status varchar(32) not null default 'RECORDED',recorded_by bigint,recorded_at timestamp not null default current_timestamp,confirmed_by bigint,confirmed_at timestamp,updated_at timestamp not null default current_timestamp,unique(advancement_review_id,trainee_user_id),unique(advancement_review_id,group_reference))");
        jdbc.execute("create table user_grade_advanced_training_evidence (id bigint auto_increment primary key,advancement_review_id bigint not null,trainee_user_id bigint not null,scope_reference varchar(128) not null,observation_start date not null,observation_end date not null,evidence_note varchar(1000) not null,evidence_status varchar(32) not null default 'RECORDED',recorded_by bigint,recorded_at timestamp not null default current_timestamp,confirmed_by bigint,confirmed_at timestamp,updated_at timestamp not null default current_timestamp,unique(advancement_review_id,trainee_user_id),unique(advancement_review_id,scope_reference))");
    }

    @Test
    void recordsEachAdvancedGradeGateWithoutChangingTeamOrRewardState() {
        users.save(UserDistributionProfile.create(200L, "BR", "pt", "ADV-200"));
        users.save(UserDistributionProfile.create(201L, "BR", "pt", "ADV-201"));
        users.save(UserDistributionProfile.create(202L, "BR", "pt", "ADV-202"));
        jdbc.update("insert into user_grade_evaluation(user_id,platform_code,guild_id,grade_code,rule_id,qualification_status,direct_invite_count,direct_income,qualified_at,evaluated_at) values(200,'LINKY','guild-1','GOLD',1,'QUALIFIED',30,0,current_timestamp,current_timestamp)");
        jdbc.update("insert into user_grade_evaluation(user_id,platform_code,guild_id,grade_code,rule_id,qualification_status,direct_invite_count,direct_income,qualified_at,evaluated_at) values(201,'LINKY','guild-1','SILVER',1,'QUALIFIED',10,0,current_timestamp,current_timestamp)");
        jdbc.update("insert into user_grade_evaluation(user_id,platform_code,guild_id,grade_code,rule_id,qualification_status,direct_invite_count,direct_income,qualified_at,evaluated_at) values(202,'LINKY','guild-1','SILVER',1,'QUALIFIED',10,0,current_timestamp,current_timestamp)");
        var actor = new AdminSessionService.AdminPrincipal(11L, "team_admin", "Team", "team", false, 1L, false, LocalDateTime.now().plusHours(1), "*", "*", "*");
        var opened = reviews.open(new UserGradeAdvancementReviewRequest(200L, "LINKY", "guild-1", "PLATINUM"), actor);
        assertThat(opened.trainingStatus()).isEqualTo("PENDING");
        LocalDate end = LocalDate.now().minusDays(1);
        reviews.recordPlatinumEvidence(opened.id(), new UserGradePlatinumEvidenceRequest(201L, "GROUP-201", end.minusDays(29), end, 5, 3, "first silver member group passed the 30-day review"), actor);
        var evidenced = reviews.recordPlatinumEvidence(opened.id(), new UserGradePlatinumEvidenceRequest(202L, "GROUP-202", end.minusDays(29), end, 5, 3, "second silver member group passed the 30-day review"), actor);
        assertThat(evidenced.platinumEvidence()).hasSize(2);

        var trained = reviews.confirmTraining(opened.id(), "two silver members accepted for cultivation", actor);
        var operated = reviews.confirmOperatingValidation(opened.id(), "30-day group observation evidence reviewed", actor);
        var confirmed = reviews.confirmResponsibility(opened.id(), "operating responsibility confirmed", actor);
        var appointed = reviews.confirmLeadershipAppointment(opened.id(), "formal leadership appointment approved", actor);

        assertThat(trained.trainingStatus()).isEqualTo("CONFIRMED");
        assertThat(trained.platinumEvidence()).allMatch(value -> "CONFIRMED".equals(value.evidenceStatus()));
        assertThat(operated.operatingValidationStatus()).isEqualTo("CONFIRMED");
        assertThat(confirmed.responsibilityStatus()).isEqualTo("CONFIRMED");
        assertThat(confirmed.reviewStatus()).isEqualTo("READY_FOR_LEADER_CONFIRMATION");
        assertThat(appointed.reviewStatus()).isEqualTo("LEADER_CONFIRMED");
        assertThat(jdbc.queryForObject("select leader_appointment_status from operating_team where leader_user_id=200", String.class)).isEqualTo("CONFIRMED");
        assertThat(reviews.recent()).hasSize(1);
    }

    @Test
    void simulatesDiamondAndBlackGoldCompleteCalendarMonthGatesWithoutWaitingForRealMonths() {
        var actor = new AdminSessionService.AdminPrincipal(11L, "team_admin", "Team", "team", false, 1L, false, LocalDateTime.now().plusHours(1), "*", "*", "*");
        for (long userId : new long[]{300L, 301L, 302L, 400L, 401L, 402L}) users.save(UserDistributionProfile.create(userId, "BR", "pt", "ADV-" + userId));
        qualifiedGold(300L); qualifiedGold(301L); qualifiedGold(302L); qualifiedGold(400L);
        confirmedAdvanced(300L, "PLATINUM");

        var diamond = reviews.open(new UserGradeAdvancementReviewRequest(300L, "LINKY", "guild-1", "DIAMOND"), actor);
        assertThatThrownBy(() -> reviews.confirmTraining(diamond.id(), "missing evidence", actor))
                .hasMessageContaining("DIAMOND requires exactly two");
        assertThatThrownBy(() -> reviews.recordAdvancedEvidence(diamond.id(), new com.fenxiao.incentive.dto.UserGradeAdvancedEvidenceRequest(301L, "TEAM-301", LocalDate.of(2026, 1, 2), LocalDate.of(2026, 3, 31), "not two complete calendar months"), actor))
                .hasMessageContaining("first day");
        reviews.recordAdvancedEvidence(diamond.id(), new com.fenxiao.incentive.dto.UserGradeAdvancedEvidenceRequest(301L, "TEAM-301", LocalDate.of(2026, 1, 1), LocalDate.of(2026, 2, 28), "two complete simulated calendar months"), actor);
        reviews.recordAdvancedEvidence(diamond.id(), new com.fenxiao.incentive.dto.UserGradeAdvancedEvidenceRequest(302L, "TEAM-302", LocalDate.of(2026, 1, 1), LocalDate.of(2026, 2, 28), "second distinct gold member"), actor);
        reviews.confirmTraining(diamond.id(), "objective diamond gates passed", actor);
        reviews.confirmOperatingValidation(diamond.id(), "business outcome reviewed", actor);
        reviews.confirmResponsibility(diamond.id(), "operating responsibility reviewed", actor);
        assertThat(reviews.confirmLeadershipAppointment(diamond.id(), "appointment approved", actor).reviewStatus()).isEqualTo("LEADER_CONFIRMED");

        confirmedAdvanced(400L, "DIAMOND");
        confirmedAdvanced(401L, "DIAMOND");
        confirmedAdvanced(402L, "DIAMOND");
        var blackGold = reviews.open(new UserGradeAdvancementReviewRequest(400L, "LINKY", "guild-1", "BLACK_GOLD"), actor);
        reviews.recordAdvancedEvidence(blackGold.id(), new com.fenxiao.incentive.dto.UserGradeAdvancedEvidenceRequest(401L, "AREA-401", LocalDate.of(2026, 1, 1), LocalDate.of(2026, 3, 31), "three complete simulated calendar months"), actor);
        reviews.recordAdvancedEvidence(blackGold.id(), new com.fenxiao.incentive.dto.UserGradeAdvancedEvidenceRequest(402L, "AREA-402", LocalDate.of(2026, 1, 1), LocalDate.of(2026, 3, 31), "second distinct diamond member"), actor);
        reviews.confirmTraining(blackGold.id(), "objective black gold gates passed", actor);
        reviews.confirmOperatingValidation(blackGold.id(), "business outcome reviewed", actor);
        reviews.confirmResponsibility(blackGold.id(), "operating responsibility reviewed", actor);
        assertThat(reviews.confirmLeadershipAppointment(blackGold.id(), "appointment approved", actor).reviewStatus()).isEqualTo("LEADER_CONFIRMED");
    }

    private void qualifiedGold(long userId) {
        jdbc.update("insert into user_grade_evaluation(user_id,platform_code,guild_id,grade_code,rule_id,qualification_status,direct_invite_count,direct_income,qualified_at,evaluated_at) values(?,'LINKY','guild-1','GOLD',1,'QUALIFIED',30,0,current_timestamp,current_timestamp)", userId);
    }

    private void confirmedAdvanced(long userId, String grade) {
        jdbc.update("insert into user_grade_advancement_review(user_id,platform_code,guild_id,target_grade_code,training_status,operating_validation_status,responsibility_status,review_status,created_at,updated_at) values(?,'LINKY','guild-1',?,'CONFIRMED','CONFIRMED','CONFIRMED','LEADER_CONFIRMED',current_timestamp,current_timestamp)", userId, grade);
        if ("DIAMOND".equals(grade)) {
            Long reviewId = jdbc.queryForObject("select id from user_grade_advancement_review where user_id=? and target_grade_code=?", Long.class, userId, grade);
            jdbc.update("insert into user_grade_advanced_training_evidence(advancement_review_id,trainee_user_id,scope_reference,observation_start,observation_end,evidence_note,evidence_status,recorded_at,updated_at) values(?,?,?,date '2026-01-01',date '2026-02-28','fixture','CONFIRMED',current_timestamp,current_timestamp)", reviewId, userId + 10000, "FIXTURE-" + userId + "-A");
            jdbc.update("insert into user_grade_advanced_training_evidence(advancement_review_id,trainee_user_id,scope_reference,observation_start,observation_end,evidence_note,evidence_status,recorded_at,updated_at) values(?,?,?,date '2026-01-01',date '2026-02-28','fixture','CONFIRMED',current_timestamp,current_timestamp)", reviewId, userId + 20000, "FIXTURE-" + userId + "-B");
        }
    }
}
