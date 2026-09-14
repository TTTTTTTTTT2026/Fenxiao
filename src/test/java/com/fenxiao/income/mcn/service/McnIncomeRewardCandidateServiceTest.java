package com.fenxiao.income.mcn.service;

import com.fenxiao.income.mcn.api.dto.McnIncomeRewardCandidateSummaryResponse;
import com.fenxiao.platform.entity.PlatformAccountBinding;
import com.fenxiao.platform.repository.PlatformAccountBindingRepository;
import com.fenxiao.relationship.entity.InvitationRelationVersion;
import com.fenxiao.relationship.repository.InvitationRelationVersionRepository;
import com.fenxiao.rule.entity.CommissionPolicy;
import com.fenxiao.rule.service.CommissionPolicyService;
import com.fenxiao.user.entity.UserDistributionProfile;
import com.fenxiao.user.repository.UserDistributionProfileRepository;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class McnIncomeRewardCandidateServiceTest {
    private static final Instant OCCURRED = Instant.parse("2026-09-11T12:00:00Z");
    private static final LocalDate DAY = LocalDate.of(2026, 9, 11);

    @Test
    @SuppressWarnings({"unchecked", "rawtypes"})
    void shouldCreateASecondLevelCandidateUsingTheIncomeTimeRelationAndRule() {
        Fixture fixture = fixture();
        McnIncomeRewardCandidateService.CandidateInput input = input(100L);
        when(fixture.jdbc.query(anyString(), any(RowMapper.class), any(Object[].class))).thenReturn(List.of(input));
        UserDistributionProfile source = UserDistributionProfile.create(100L, "ID", "id", "SOURCE");
        UserDistributionProfile inviter = UserDistributionProfile.create(200L, "ID", "id", "INVITER");
        when(fixture.users.findById(100L)).thenReturn(Optional.of(source));
        when(fixture.users.findById(200L)).thenReturn(Optional.of(inviter));
        PlatformAccountBinding binding = PlatformAccountBinding.submit(100L, "TIMO", "123456789012", LocalDateTime.ofInstant(OCCURRED.minusSeconds(60), ZoneOffset.UTC));
        binding.verify("guild", LocalDateTime.ofInstant(OCCURRED.minusSeconds(60), ZoneOffset.UTC), "MCN", "ref", LocalDateTime.ofInstant(OCCURRED.minusSeconds(60), ZoneOffset.UTC));
        when(fixture.bindings.findByUserIdAndPlatformCode(100L, "TIMO")).thenReturn(Optional.of(binding));
        InvitationRelationVersion atIncome = InvitationRelationVersion.create(100L, 200L, 3, LocalDateTime.ofInstant(OCCURRED.minusSeconds(3600), ZoneOffset.UTC), "test", "TEST", null, null);
        when(fixture.relations.findEffectiveAt(100L, LocalDateTime.ofInstant(OCCURRED, ZoneOffset.UTC))).thenReturn(Optional.of(atIncome));
        when(fixture.relations.findEffectiveAt(200L, LocalDateTime.ofInstant(OCCURRED, ZoneOffset.UTC))).thenReturn(Optional.empty());
        when(fixture.policies.findEffective("TIMO", "ID", LocalDateTime.ofInstant(OCCURRED, ZoneOffset.UTC)))
                .thenReturn(Optional.of(policy(1)));

        McnIncomeRewardCandidateSummaryResponse result = fixture.service.refresh("TIMO", DAY);

        assertThat(result.sourceFactCount()).isEqualTo(1);
        assertThat(result.sourceReadyCount()).isEqualTo(1);
        assertThat(result.candidateCount()).isEqualTo(1);
        assertThat(result.blockedCount()).isZero();
        assertThat(result.candidateAmount()).isEqualByComparingTo("10.000000");
        assertThat(result.amountUnit()).isEqualTo("TIMO_DIAMOND");
    }

    @Test
    @SuppressWarnings({"unchecked", "rawtypes"})
    void shouldBlockHistoricalIncomeWhenBindingWasVerifiedAfterItOccurred() {
        Fixture fixture = fixture();
        when(fixture.jdbc.query(anyString(), any(RowMapper.class), any(Object[].class))).thenReturn(List.of(input(100L)));
        when(fixture.users.findById(100L)).thenReturn(Optional.of(UserDistributionProfile.create(100L, "ID", "id", "SOURCE")));
        PlatformAccountBinding late = PlatformAccountBinding.submit(100L, "TIMO", "123456789012", LocalDateTime.ofInstant(OCCURRED.plusSeconds(1), ZoneOffset.UTC));
        late.verify("guild", LocalDateTime.ofInstant(OCCURRED.plusSeconds(1), ZoneOffset.UTC), "MCN", "ref", LocalDateTime.ofInstant(OCCURRED.plusSeconds(1), ZoneOffset.UTC));
        when(fixture.bindings.findByUserIdAndPlatformCode(100L, "TIMO")).thenReturn(Optional.of(late));

        McnIncomeRewardCandidateSummaryResponse result = fixture.service.refresh("TIMO", DAY);

        assertThat(result.sourceReadyCount()).isZero();
        assertThat(result.candidateCount()).isZero();
        assertThat(result.blockedCount()).isEqualTo(1);
    }

    @Test
    @SuppressWarnings({"unchecked", "rawtypes"})
    void shouldStopAtTheConfiguredDirectOnlyDepthInsteadOfTreatingLaterLevelsAsZeroRateRules() {
        Fixture fixture = fixture();
        when(fixture.jdbc.query(anyString(), any(RowMapper.class), any(Object[].class))).thenReturn(List.of(input(100L)));
        UserDistributionProfile source = UserDistributionProfile.create(100L, "ID", "id", "SOURCE");
        UserDistributionProfile direct = UserDistributionProfile.create(200L, "ID", "id", "DIRECT");
        when(fixture.users.findById(100L)).thenReturn(Optional.of(source));
        when(fixture.users.findById(200L)).thenReturn(Optional.of(direct));
        PlatformAccountBinding binding = PlatformAccountBinding.submit(100L, "TIMO", "123456789012", LocalDateTime.ofInstant(OCCURRED.minusSeconds(60), ZoneOffset.UTC));
        binding.verify("guild", LocalDateTime.ofInstant(OCCURRED.minusSeconds(60), ZoneOffset.UTC), "MCN", "ref", LocalDateTime.ofInstant(OCCURRED.minusSeconds(60), ZoneOffset.UTC));
        when(fixture.bindings.findByUserIdAndPlatformCode(100L, "TIMO")).thenReturn(Optional.of(binding));
        when(fixture.relations.findEffectiveAt(100L, LocalDateTime.ofInstant(OCCURRED, ZoneOffset.UTC))).thenReturn(Optional.of(
                InvitationRelationVersion.create(100L, 200L, 1, LocalDateTime.ofInstant(OCCURRED.minusSeconds(3600), ZoneOffset.UTC), "test", "TEST", null, null)));
        when(fixture.policies.findEffective("TIMO", "ID", LocalDateTime.ofInstant(OCCURRED, ZoneOffset.UTC))).thenReturn(Optional.of(policy(1)));

        McnIncomeRewardCandidateSummaryResponse result = fixture.service.refresh("TIMO", DAY);

        assertThat(result.candidateCount()).isEqualTo(1);
        assertThat(result.blockedCount()).isZero();
        verify(fixture.relations, never()).findEffectiveAt(200L, LocalDateTime.ofInstant(OCCURRED, ZoneOffset.UTC));
    }

    private McnIncomeRewardCandidateService.CandidateInput input(Long sourceUserId) {
        return new McnIncomeRewardCandidateService.CandidateInput("event-1", 1L, "revision-1", DAY, sourceUserId,
                "BOUND_FINAL", OCCURRED, new BigDecimal("100.000000"), "XXX", "TIMO_DIAMOND");
    }

    private Fixture fixture() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);
        PlatformAccountBindingRepository bindings = mock(PlatformAccountBindingRepository.class);
        InvitationRelationVersionRepository relations = mock(InvitationRelationVersionRepository.class);
        CommissionPolicyService policies = mock(CommissionPolicyService.class);
        UserDistributionProfileRepository users = mock(UserDistributionProfileRepository.class);
        return new Fixture(jdbc, bindings, relations, policies, users,
                new McnIncomeRewardCandidateService(jdbc, bindings, relations, policies, users, Clock.fixed(Instant.parse("2026-09-14T00:00:00Z"), ZoneOffset.UTC)));
    }

    private CommissionPolicy policy(int maxLevel) {
        return CommissionPolicy.draft("CP-TEST", "TIMO", "ID", maxLevel,
                true, new BigDecimal("0.10"), 7,
                maxLevel >= 2, maxLevel >= 2 ? new BigDecimal("0.02") : null, maxLevel >= 2 ? 7 : null,
                maxLevel >= 3, maxLevel >= 3 ? new BigDecimal("0.005") : null, maxLevel >= 3 ? 7 : null,
                LocalDateTime.ofInstant(OCCURRED.minusSeconds(3600), ZoneOffset.UTC), null, 1L);
    }

    private record Fixture(JdbcTemplate jdbc, PlatformAccountBindingRepository bindings, InvitationRelationVersionRepository relations,
                           CommissionPolicyService policies, UserDistributionProfileRepository users, McnIncomeRewardCandidateService service) { }
}
