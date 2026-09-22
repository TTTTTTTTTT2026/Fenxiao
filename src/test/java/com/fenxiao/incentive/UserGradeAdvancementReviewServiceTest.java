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

import java.time.LocalDate;
import java.time.LocalDateTime;

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
        jdbc.execute("drop table if exists user_grade_advancement_review");
        jdbc.execute("drop table if exists mcn_income_shadow_ledger_projection");
        jdbc.execute("drop table if exists invitation_relation_version");
        jdbc.execute("drop table if exists user_grade_evaluation");
        jdbc.execute("create table user_grade_evaluation (id bigint auto_increment primary key,user_id bigint not null,platform_code varchar(32) not null,guild_id varchar(64) not null,grade_code varchar(32) not null,rule_id bigint not null,qualification_status varchar(32) not null,direct_invite_count int not null,direct_income decimal(18,6) not null,qualified_at timestamp,evaluated_at timestamp not null,unique(user_id,platform_code,guild_id,grade_code))");
        jdbc.execute("create table invitation_relation_version (id bigint auto_increment primary key,user_id bigint not null,inviter_user_id bigint,version_no int not null,effective_from timestamp not null,effective_to timestamp,change_reason varchar(255) not null,source_type varchar(32) not null,created_at timestamp not null,updated_at timestamp not null)");
        jdbc.execute("create table mcn_income_shadow_ledger_projection (id bigint auto_increment primary key,source_system varchar(32),platform_code varchar(32) not null,source_event_id varchar(128),raw_ledger_event_id bigint,source_revision varchar(512),resolved_user_id bigint,business_date date not null,settlement_status varchar(32) not null,event_type varchar(32) not null,amount decimal(18,6),amount_unit varchar(32),currency_code varchar(16),shadow_status varchar(32) not null,source_updated_at timestamp,projected_at timestamp)");
        jdbc.execute("create table user_grade_advancement_review (id bigint auto_increment primary key,user_id bigint not null,platform_code varchar(32) not null,guild_id varchar(64) not null,target_grade_code varchar(32) not null,observation_start date not null,observation_end date not null,eligible_silver_member_count int not null default 0,passed_silver_member_count int not null default 0,required_silver_member_count int not null default 2,review_status varchar(32) not null,promotion_confirmed_by bigint,promotion_confirmed_at timestamp,promotion_note varchar(512),failure_note varchar(512),created_by bigint,created_at timestamp not null default current_timestamp,updated_at timestamp not null default current_timestamp)");
    }

    @Test
    void automaticallyCalculatesTwoOrMoreSilverMembersWithoutOperatingGroupRecords() {
        seedUser(200); seedUser(201); seedUser(202);
        qualified(200, "GOLD"); qualified(201, "SILVER"); qualified(202, "SILVER");
        relation(201, 200); relation(202, 200);
        var opened = reviews.open(new UserGradeAdvancementReviewRequest(200L, "LINKY", "guild-1", "PLATINUM"), actor());
        assertThat(opened.reviewStatus()).isEqualTo("IN_PROGRESS");
        assertThat(opened.observationEnd()).isEqualTo(opened.observationStart().plusDays(29));

        LocalDate end = LocalDate.now().minusDays(1);
        jdbc.update("update user_grade_advancement_review set observation_start=?,observation_end=? where id=?", end.minusDays(29), end, opened.id());
        seedSilverOutcome(201, 2010, end);
        seedSilverOutcome(202, 2020, end);

        var passed = reviews.recent().getFirst();
        assertThat(passed.reviewStatus()).isEqualTo("PASSED");
        assertThat(passed.passedSilverMemberCount()).isEqualTo(2);
        assertThat(passed.progress()).allMatch(item -> item.effectiveDirectInviteeCount() == 5 && item.passed());

        var upgraded = reviews.confirmCanUpgrade(opened.id(), "two Silver members passed automated observation", actor());
        assertThat(upgraded.promotionConfirmedAt()).isNotNull();
        assertThat(upgraded.reviewStatus()).isEqualTo("PASSED");
    }

    @Test
    void onlyQualifiedGoldCanStartThePlatinumObservation() {
        seedUser(300);
        assertThatThrownBy(() -> reviews.open(new UserGradeAdvancementReviewRequest(300L, "LINKY", "guild-1", "PLATINUM"), actor())).hasMessageContaining("qualified GOLD");
        assertThatThrownBy(() -> reviews.open(new UserGradeAdvancementReviewRequest(300L, "LINKY", "guild-1", "DIAMOND"), actor())).hasMessageContaining("only PLATINUM");
    }

    private void seedSilverOutcome(long silverUserId, long firstInviteeId, LocalDate end) {
        for (long userId = firstInviteeId; userId < firstInviteeId + 5; userId++) {
            seedUser(userId); relation(userId, silverUserId);
            for (int day = 0; day < 3; day++) jdbc.update("insert into mcn_income_shadow_ledger_projection(platform_code,resolved_user_id,business_date,settlement_status,event_type,shadow_status) values('LINKY',?,?,'SETTLED','INCOME','BOUND_FINAL')", userId, end.minusDays(day));
        }
    }
    private void seedUser(long id) { if (users.findById(id).isEmpty()) users.save(UserDistributionProfile.create(id, "BR", "pt", "U-" + id)); }
    private void qualified(long id, String grade) { jdbc.update("insert into user_grade_evaluation(user_id,platform_code,guild_id,grade_code,rule_id,qualification_status,direct_invite_count,direct_income,qualified_at,evaluated_at) values(?,'LINKY','guild-1',?,1,'QUALIFIED',30,0,current_timestamp,current_timestamp)", id, grade); }
    private void relation(long userId, long inviterId) { LocalDateTime now = LocalDateTime.now(); jdbc.update("insert into invitation_relation_version(user_id,inviter_user_id,version_no,effective_from,change_reason,source_type,created_at,updated_at) values(?,?,1,?,'test','TEST',?,?)", userId, inviterId, now.minusDays(40), now, now); }
    private AdminSessionService.AdminPrincipal actor() { return new AdminSessionService.AdminPrincipal(11L, "team_admin", "Team", "team", false, 1L, false, LocalDateTime.now().plusHours(1), "*", "*", "*"); }
}
