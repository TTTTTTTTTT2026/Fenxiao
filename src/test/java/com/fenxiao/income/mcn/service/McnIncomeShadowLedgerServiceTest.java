package com.fenxiao.income.mcn.service;

import com.fenxiao.income.mcn.api.dto.McnIncomeShadowLedgerSummaryResponse;
import com.fenxiao.income.mcn.domain.McnIncomeEventType;
import com.fenxiao.income.mcn.domain.McnIncomeResolutionStatus;
import com.fenxiao.income.mcn.domain.McnIncomeSettlementStatus;
import com.fenxiao.income.mcn.entity.McnIncomeRawLedgerEvent;
import com.fenxiao.income.mcn.repository.McnIncomeRawLedgerEventRepository;
import com.fenxiao.platform.entity.PlatformAccountBinding;
import com.fenxiao.platform.repository.PlatformAccountBindingRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.jdbc.core.JdbcTemplate;

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
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class McnIncomeShadowLedgerServiceTest {
    private static final LocalDate DAY = LocalDate.of(2026, 9, 11);
    private static final Instant NOW = Instant.parse("2026-09-13T08:00:00Z");

    @Test
    void refreshUsesOnlyTheLatestRevisionAndCurrentVerifiedBinding() {
        McnIncomeRawLedgerEventRepository rawEvents = mock(McnIncomeRawLedgerEventRepository.class);
        PlatformAccountBindingRepository bindings = mock(PlatformAccountBindingRepository.class);
        JdbcTemplate jdbc = writableJdbc();
        McnIncomeRawLedgerEvent older = fact("event-1", "1", "account-1", NOW.minusSeconds(120), McnIncomeEventType.INCOME, McnIncomeSettlementStatus.SETTLED);
        McnIncomeRawLedgerEvent latest = fact("event-1", "2", "account-1", NOW.minusSeconds(60), McnIncomeEventType.INCOME, McnIncomeSettlementStatus.SETTLED);
        when(rawEvents.findBySourceSystemAndPlatformCodeAndBusinessDateBetween("MCN", "TIMO", DAY, DAY)).thenReturn(List.of(older, latest));
        PlatformAccountBinding verified = PlatformAccountBinding.submit(72L, "TIMO", "account-1", LocalDateTime.ofInstant(NOW, ZoneOffset.UTC));
        verified.verify("guild-1", LocalDateTime.ofInstant(NOW, ZoneOffset.UTC), "MCN", "ref", LocalDateTime.ofInstant(NOW, ZoneOffset.UTC));
        when(bindings.findByPlatformCodeAndPlatformUserId("TIMO", "account-1")).thenReturn(Optional.of(verified));

        McnIncomeShadowLedgerSummaryResponse result = service(rawEvents, bindings, jdbc).refresh("timo", DAY);

        assertThat(result.sourceFactCount()).isEqualTo(2);
        assertThat(result.latestFactCount()).isEqualTo(1);
        assertThat(result.boundFinalCount()).isEqualTo(1);
        ArgumentCaptor<Object[]> values = ArgumentCaptor.forClass(Object[].class);
        verify(jdbc, times(2)).update(anyString(), values.capture());
        assertThat(values.getAllValues().getFirst()[4]).isEqualTo("2");
        assertThat(values.getAllValues().getFirst()[7]).isEqualTo(72L);
    }

    @Test
    void refreshKeepsUnboundFactsOutOfTheBoundFinalPopulation() {
        McnIncomeRawLedgerEventRepository rawEvents = mock(McnIncomeRawLedgerEventRepository.class);
        PlatformAccountBindingRepository bindings = mock(PlatformAccountBindingRepository.class);
        when(rawEvents.findBySourceSystemAndPlatformCodeAndBusinessDateBetween("MCN", "LINKY", DAY, DAY)).thenReturn(List.of(fact("event-2", "1", "account-2", NOW, McnIncomeEventType.INCOME, McnIncomeSettlementStatus.SETTLED)));
        when(bindings.findByPlatformCodeAndPlatformUserId("LINKY", "account-2")).thenReturn(Optional.empty());

        McnIncomeShadowLedgerSummaryResponse result = service(rawEvents, bindings, writableJdbc()).refresh("LINKY", DAY);

        assertThat(result.boundFinalCount()).isZero();
        assertThat(result.unmatchedCount()).isEqualTo(1);
    }

    @Test
    void refreshClassifiesVerifiedPendingAndReversalFactsWithoutTreatingThemAsFinalIncome() {
        McnIncomeRawLedgerEventRepository rawEvents = mock(McnIncomeRawLedgerEventRepository.class);
        PlatformAccountBindingRepository bindings = mock(PlatformAccountBindingRepository.class);
        PlatformAccountBinding verified = PlatformAccountBinding.submit(7L, "TIMO", "account-3", LocalDateTime.ofInstant(NOW, ZoneOffset.UTC));
        verified.verify("guild-3", LocalDateTime.ofInstant(NOW, ZoneOffset.UTC), "MCN", "ref", LocalDateTime.ofInstant(NOW, ZoneOffset.UTC));
        when(rawEvents.findBySourceSystemAndPlatformCodeAndBusinessDateBetween("MCN", "TIMO", DAY, DAY)).thenReturn(List.of(
                fact("event-3", "1", "account-3", NOW, McnIncomeEventType.INCOME, McnIncomeSettlementStatus.PENDING),
                fact("event-4", "1", "account-3", NOW, McnIncomeEventType.REVERSAL, McnIncomeSettlementStatus.SETTLED)));
        when(bindings.findByPlatformCodeAndPlatformUserId("TIMO", "account-3")).thenReturn(Optional.of(verified));

        McnIncomeShadowLedgerSummaryResponse result = service(rawEvents, bindings, writableJdbc()).refresh("TIMO", DAY);

        assertThat(result.boundFinalCount()).isZero();
        assertThat(result.awaitingFinalityCount()).isEqualTo(1);
        assertThat(result.voidedCount()).isEqualTo(1);
    }

    private McnIncomeShadowLedgerService service(McnIncomeRawLedgerEventRepository rawEvents, PlatformAccountBindingRepository bindings, JdbcTemplate jdbc) {
        return new McnIncomeShadowLedgerService(rawEvents, bindings, jdbc, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    private JdbcTemplate writableJdbc() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);
        return jdbc;
    }

    private McnIncomeRawLedgerEvent fact(String eventId, String revision, String platformUserId, Instant updatedAt, McnIncomeEventType eventType, McnIncomeSettlementStatus settlementStatus) {
        return McnIncomeRawLedgerEvent.record("MCN", "delivery", "TIMO", "DAILY", eventId, revision, null, platformUserId,
                null, McnIncomeResolutionStatus.UNMATCHED, "not-yet-bound", eventType, settlementStatus, BigDecimal.ONE,
                "USD", "USD", DAY, "UTC", NOW.minusSeconds(3600), NOW, NOW.minusSeconds(30), null, updatedAt,
                "guild-1", "hash", "{}", NOW, "MCN");
    }
}
