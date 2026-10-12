package com.fenxiao.distribution;

import com.fenxiao.distribution.service.ConsumerGradeProgressService;
import com.fenxiao.incentive.dto.UserGradeRuleResponse;
import com.fenxiao.incentive.service.EffectiveUserQualificationService;
import com.fenxiao.incentive.service.UserGradeAdminService;
import com.fenxiao.platform.domain.PlatformBindingStatus;
import com.fenxiao.platform.entity.PlatformAccountBinding;
import com.fenxiao.platform.repository.PlatformAccountBindingRepository;
import com.fenxiao.user.entity.UserDistributionProfile;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ConsumerGradeProgressServiceTest {
    private final Clock clock = Clock.fixed(Instant.parse("2026-10-12T00:00:00Z"), ZoneOffset.UTC);
    private final LocalDateTime now = LocalDateTime.now(clock);
    private JdbcTemplate jdbc;
    private ConsumerGradeProgressService progress;
    private UserGradeAdminService grades;

    @BeforeEach void setUp() {
        jdbc = new JdbcTemplate(new DriverManagerDataSource("jdbc:h2:mem:" + UUID.randomUUID() + ";MODE=MySQL;DB_CLOSE_DELAY=-1", "sa", ""));
        jdbc.execute("create table user_grade_evaluation(user_id bigint,platform_code varchar, guild_id varchar,grade_code varchar,qualification_status varchar,evaluated_at timestamp)");
        jdbc.execute("create table user_grade_advancement_review(user_id bigint,platform_code varchar,target_grade_code varchar,promotion_confirmed_at timestamp)");
        jdbc.execute("create table invitation_relation_version(user_id bigint,inviter_user_id bigint,effective_from timestamp,effective_to timestamp)");
        jdbc.execute("create table effective_user_qualification_fact(user_id bigint,platform_code varchar,qualification_status varchar,current_activity_status varchar)");
        var users = mock(UserDistributionProfileRepository.class);
        var user = mock(UserDistributionProfile.class);
        when(user.getCountryCode()).thenReturn("ID");
        when(users.findById(1L)).thenReturn(Optional.of(user));
        var bindings = mock(PlatformAccountBindingRepository.class);
        var binding = mock(PlatformAccountBinding.class);
        when(binding.getBindingStatus()).thenReturn(PlatformBindingStatus.VERIFIED);
        when(binding.getOfficialGuildId()).thenReturn("guild");
        when(bindings.findByUserIdAndPlatformCode(eq(1L), anyString())).thenReturn(Optional.of(binding));
        grades = mock(UserGradeAdminService.class);
        when(grades.applicableBaseRules(anyString(), eq("ID"), eq("guild"), eq(now))).thenAnswer(invocation -> List.of(
                new UserGradeRuleResponse(1, "rule", 1, "NEW_STAR", invocation.getArgument(0), "ID", null, 3, BigDecimal.ZERO,
                        now.minusDays(1), null, "ACTIVE", null, null, null, null)));
        progress = new ConsumerGradeProgressService(jdbc, users, bindings, new EffectiveUserQualificationService(jdbc, null, clock), grades, clock);
        evaluation("TIMO", "NEW_STAR", "IN_PROGRESS");
    }

    private void evaluation(String platform, String grade, String state) {
        jdbc.update("insert into user_grade_evaluation values(1,?,'guild',?,?,?)", platform, grade, state, now.minusHours(1));
    }
    private void invite(long user, long inviter, String platform, String status) {
        jdbc.update("insert into invitation_relation_version values(?,?,?,null)", user, inviter, now.minusDays(10));
        jdbc.update("insert into effective_user_qualification_fact values(?,?,?,'NOT_ACTIVE')", user, platform, status);
    }

    @Test void countsTwoDirectAndNotEightIndirectWithoutWritingAnything() {
        invite(2, 1, "TIMO", "QUALIFIED"); invite(3, 1, "TIMO", "QUALIFIED");
        for (long user = 4; user < 12; user++) invite(user, 2, "TIMO", "QUALIFIED");
        var result = progress.get(1, "TIMO");
        assertThat(result.qualifiedDirectInviteCount()).isEqualTo(2);
        assertThat(result.requiredDirectInviteCount()).isEqualTo(3);
        assertThat(result.state()).isEqualTo("IN_PROGRESS");
        assertThat(jdbc.queryForObject("select count(*) from user_grade_evaluation", Integer.class)).isEqualTo(1);
        assertThat(jdbc.queryForObject("select qualification_status from user_grade_evaluation", String.class)).isEqualTo("IN_PROGRESS");
        verify(grades, never()).evaluate(anyLong(), anyString());
    }
    @Test void threeQualifiedInviteesDoesNotGrantAGrade() {
        for (long user = 2; user < 5; user++) invite(user, 1, "TIMO", "QUALIFIED");
        assertThat(progress.get(1, "TIMO").state()).isEqualTo("AWAITING_REVIEW");
    }
    @Test void inactiveInviteesDoNotRemoveEarnedGrade() {
        evaluation("TIMO", "SILVER", "QUALIFIED");
        var result = progress.get(1, "TIMO");
        assertThat(result.state()).isEqualTo("ACHIEVED");
        assertThat(result.currentGradeCode()).isEqualTo("SILVER");
        assertThat(result.requiredDirectInviteCount()).isNull();
    }
    @Test void manualReviewDoesNotPretendTheUserIsANormalMember() {
        evaluation("TIMO", "NEW_STAR", "REQUIRES_MANUAL_REVIEW");
        var result = progress.get(1, "TIMO");
        assertThat(result.state()).isEqualTo("REVIEW_REQUIRED");
        assertThat(result.currentGradeCode()).isNull();
    }
    @Test void applicationsRemainSeparate() {
        invite(2, 1, "TIMO", "QUALIFIED"); invite(3, 1, "LINKY", "QUALIFIED");
        evaluation("LINKY", "NEW_STAR", "IN_PROGRESS");
        assertThat(progress.get(1, "TIMO").qualifiedDirectInviteCount()).isEqualTo(1);
        assertThat(progress.get(1, "LINKY").qualifiedDirectInviteCount()).isEqualTo(1);
        evaluation("LINKY", "GOLD", "QUALIFIED");
        assertThat(progress.get(1, "TIMO").state()).isEqualTo("IN_PROGRESS");
    }
    @Test void missingEvaluationDoesNotBecomeZero() {
        jdbc.update("delete from user_grade_evaluation");
        var result = progress.get(1, "TIMO");
        assertThat(result.state()).isEqualTo("UNKNOWN");
        assertThat(result.qualifiedDirectInviteCount()).isNull();
    }
    @Test void missingRuleDoesNotFallBackToHardcodedThree() {
        when(grades.applicableBaseRules(anyString(), anyString(), anyString(), any())).thenReturn(List.of());
        assertThat(progress.get(1, "TIMO").requiredDirectInviteCount()).isNull();
    }
    @Test void correctedEvidenceAndExpiredRelationshipsAreNotCounted() {
        invite(2, 1, "TIMO", "MANUALLY_EXCLUDED"); invite(3, 1, "TIMO", "EVIDENCE_REVOKED");
        invite(4, 1, "TIMO", "QUALIFIED");
        jdbc.update("update invitation_relation_version set effective_to=? where user_id=4", now.minusDays(1));
        assertThat(progress.get(1, "TIMO").qualifiedDirectInviteCount()).isZero();
    }
    @Test void databaseFailureIsNotConvertedToZeroOrNormalMember() {
        jdbc.execute("drop table user_grade_evaluation");
        assertThatThrownBy(() -> progress.get(1, "TIMO")).isInstanceOf(org.springframework.dao.DataAccessException.class);
    }
    @Test void confirmedAdvancedGradeDoesNotShowANewStarTask() {
        jdbc.update("insert into user_grade_advancement_review values(1,'TIMO','PLATINUM',?)", now);
        assertThat(progress.get(1, "TIMO").currentGradeCode()).isEqualTo("PLATINUM");
    }
}
