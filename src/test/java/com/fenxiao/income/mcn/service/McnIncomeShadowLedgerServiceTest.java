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
    private static final LocalDate NEXT_DAY = DAY.plusDays(1);
    private static final Instant NOW = Instant.parse("2026-09-13T08:00:00Z");

    @Test
    void refreshUsesOnlyTheLatestRevisionAndCurrentVerifiedBinding() {
        McnIncomeRawLedgerEventRepository rawEvents = mock(McnIncomeRawLedgerEventRepository.class);
        PlatformAccountBindingRepository bindings = mock(PlatformAccountBindingRepository.class);
        JdbcTemplate jdbc = writableJdbc();
        McnIncomeRawLedgerEvent older = fact("event-1", "1", "account-1", NOW.minusSeconds(120), McnIncomeEventType.INCOME, McnIncomeSettlementStatus.SETTLED);
        McnIncomeRawLedgerEvent latest = fact("event-1", "2", "account-1", NOW.minusSeconds(60), McnIncomeEventType.INCOME, McnIncomeSettlementStatus.SETTLED);
        when(rawEvents.findBySourceSystemAndPlatformCodeAndBusinessDateBetween("MCN", "TIMO", DAY, DAY)).thenReturn(List.of(older, latest));
        when(rawEvents.findLatestBySourceSystemAndPlatformCodeAndBusinessDateBetween("MCN", "TIMO", DAY, DAY)).thenReturn(List.of(latest));
        PlatformAccountBinding verified = PlatformAccountBinding.submit(72L, "TIMO", "account-1", LocalDateTime.ofInstant(NOW, ZoneOffset.UTC));
        verified.verify("guild-1", LocalDateTime.ofInstant(NOW, ZoneOffset.UTC), "MCN", "ref", LocalDateTime.ofInstant(NOW, ZoneOffset.UTC));
        when(bindings.findByPlatformCodeAndPlatformUserIdIn("TIMO", List.of("account-1"))).thenReturn(List.of(verified));

        McnIncomeShadowLedgerSummaryResponse result = service(rawEvents, bindings, jdbc).refresh("timo", DAY);

        assertThat(result.sourceFactCount()).isEqualTo(2);
        assertThat(result.latestFactCount()).isEqualTo(1);
        assertThat(result.boundFinalCount()).isEqualTo(1);
        ArgumentCaptor<List<Object[]>> values = ArgumentCaptor.forClass(List.class);
        verify(jdbc).batchUpdate(anyString(), values.capture());
        assertThat(values.getValue().getFirst()[4]).isEqualTo("2");
        assertThat(values.getValue().getFirst()[7]).isEqualTo(72L);
    }

    @Test
    void refreshKeepsUnboundFactsOutOfTheBoundFinalPopulation() {
        McnIncomeRawLedgerEventRepository rawEvents = mock(McnIncomeRawLedgerEventRepository.class);
        PlatformAccountBindingRepository bindings = mock(PlatformAccountBindingRepository.class);
        McnIncomeRawLedgerEvent fact = fact("event-2", "1", "account-2", NOW, McnIncomeEventType.INCOME, McnIncomeSettlementStatus.SETTLED);
        when(rawEvents.findBySourceSystemAndPlatformCodeAndBusinessDateBetween("MCN", "LINKY", DAY, DAY)).thenReturn(List.of(fact));
        when(rawEvents.findLatestBySourceSystemAndPlatformCodeAndBusinessDateBetween("MCN", "LINKY", DAY, DAY)).thenReturn(List.of(fact));
        when(bindings.findByPlatformCodeAndPlatformUserIdIn("LINKY", List.of("account-2"))).thenReturn(List.of());

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
        List<McnIncomeRawLedgerEvent> facts = List.of(
                fact("event-3", "1", "account-3", NOW, McnIncomeEventType.INCOME, McnIncomeSettlementStatus.PENDING),
                fact("event-4", "1", "account-3", NOW, McnIncomeEventType.REVERSAL, McnIncomeSettlementStatus.SETTLED));
        when(rawEvents.findBySourceSystemAndPlatformCodeAndBusinessDateBetween("MCN", "TIMO", DAY, DAY)).thenReturn(facts);
        when(rawEvents.findLatestBySourceSystemAndPlatformCodeAndBusinessDateBetween("MCN", "TIMO", DAY, DAY)).thenReturn(facts);
        when(bindings.findByPlatformCodeAndPlatformUserIdIn("TIMO", List.of("account-3"))).thenReturn(List.of(verified));

        McnIncomeShadowLedgerSummaryResponse result = service(rawEvents, bindings, writableJdbc()).refresh("TIMO", DAY);

        assertThat(result.boundFinalCount()).isZero();
        assertThat(result.awaitingFinalityCount()).isEqualTo(1);
        assertThat(result.voidedCount()).isEqualTo(1);
    }

    @Test
    void refreshVoidsTheReferencedOriginalFactWhenItsLatestReversalArrivesLater() {
        McnIncomeRawLedgerEventRepository rawEvents = mock(McnIncomeRawLedgerEventRepository.class);
        PlatformAccountBindingRepository bindings = mock(PlatformAccountBindingRepository.class);
        McnIncomeRawLedgerEvent original = fact("event-original", "1", "account-6", NOW.minusSeconds(60), McnIncomeEventType.INCOME, McnIncomeSettlementStatus.SETTLED);
        McnIncomeRawLedgerEvent reversal = McnIncomeRawLedgerEvent.record("MCN", "delivery-reversal", "TIMO", "DAILY", "event-reversal", "1", "event-original", "account-6",
                null, McnIncomeResolutionStatus.UNMATCHED, "not-yet-bound", McnIncomeEventType.REVERSAL, McnIncomeSettlementStatus.SETTLED, BigDecimal.ZERO,
                "USD", "USD", NEXT_DAY, "UTC", NOW.minusSeconds(3600), NOW, NOW.minusSeconds(30), null, NOW,
                "guild-1", "hash-reversal", "{}", NOW, "MCN");
        when(rawEvents.findBySourceSystemAndPlatformCodeAndBusinessDateBetween("MCN", "TIMO", DAY, DAY)).thenReturn(List.of(original));
        when(rawEvents.findLatestBySourceSystemAndPlatformCodeAndBusinessDateBetween("MCN", "TIMO", DAY, DAY)).thenReturn(List.of(original));
        when(rawEvents.findLatestBySourceSystemAndPlatformCodeAndEventType("MCN", "TIMO", McnIncomeEventType.REVERSAL)).thenReturn(List.of(reversal));
        PlatformAccountBinding verified = PlatformAccountBinding.submit(8L, "TIMO", "account-6", LocalDateTime.ofInstant(NOW, ZoneOffset.UTC));
        verified.verify("guild-1", LocalDateTime.ofInstant(NOW, ZoneOffset.UTC), "MCN", "ref", LocalDateTime.ofInstant(NOW, ZoneOffset.UTC));
        when(bindings.findByPlatformCodeAndPlatformUserIdIn("TIMO", List.of("account-6"))).thenReturn(List.of(verified));

        McnIncomeShadowLedgerSummaryResponse result = service(rawEvents, bindings, writableJdbc()).refresh("TIMO", DAY);

        assertThat(result.boundFinalCount()).isZero();
        assertThat(result.voidedCount()).isEqualTo(1);
    }

    @Test
    void refreshDoesNotLeaveASupersededFactOnItsOriginalBusinessDateAfterCrossDayCorrection() {
        McnIncomeRawLedgerEventRepository rawEvents = mock(McnIncomeRawLedgerEventRepository.class);
        PlatformAccountBindingRepository bindings = mock(PlatformAccountBindingRepository.class);
        JdbcTemplate jdbc = writableJdbc();
        McnIncomeRawLedgerEvent original = fact("event-cross-day", "1", "account-5", DAY, NOW.minusSeconds(60), McnIncomeEventType.INCOME, McnIncomeSettlementStatus.SETTLED);
        McnIncomeRawLedgerEvent corrected = fact("event-cross-day", "2", "account-5", NEXT_DAY, NOW, McnIncomeEventType.INCOME, McnIncomeSettlementStatus.SETTLED);
        when(rawEvents.findBySourceSystemAndPlatformCodeAndBusinessDateBetween("MCN", "TIMO", DAY, DAY)).thenReturn(List.of(original));
        when(rawEvents.findLatestBySourceSystemAndPlatformCodeAndBusinessDateBetween("MCN", "TIMO", DAY, DAY)).thenReturn(List.of());
        when(rawEvents.findBySourceSystemAndPlatformCodeAndBusinessDateBetween("MCN", "TIMO", NEXT_DAY, NEXT_DAY)).thenReturn(List.of(corrected));
        when(rawEvents.findLatestBySourceSystemAndPlatformCodeAndBusinessDateBetween("MCN", "TIMO", NEXT_DAY, NEXT_DAY)).thenReturn(List.of(corrected));
        when(bindings.findByPlatformCodeAndPlatformUserIdIn("TIMO", List.of("account-5"))).thenReturn(List.of());

        McnIncomeShadowLedgerSummaryResponse originalDay = service(rawEvents, bindings, jdbc).refresh("TIMO", DAY);
        McnIncomeShadowLedgerSummaryResponse correctedDay = service(rawEvents, bindings, jdbc).refresh("TIMO", NEXT_DAY);

        assertThat(originalDay.sourceFactCount()).isEqualTo(1);
        assertThat(originalDay.latestFactCount()).isZero();
        assertThat(correctedDay.sourceFactCount()).isEqualTo(1);
        assertThat(correctedDay.latestFactCount()).isEqualTo(1);
        verify(jdbc, times(2)).update(org.mockito.ArgumentMatchers.startsWith("DELETE FROM mcn_income_shadow_ledger_projection"), any(Object[].class));
    }

    private McnIncomeShadowLedgerService service(McnIncomeRawLedgerEventRepository rawEvents, PlatformAccountBindingRepository bindings, JdbcTemplate jdbc) {
        return new McnIncomeShadowLedgerService(rawEvents, bindings, jdbc, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    private JdbcTemplate writableJdbc() {
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        when(jdbc.update(anyString(), any(Object[].class))).thenReturn(1);
        when(jdbc.batchUpdate(anyString(), any(List.class))).thenReturn(new int[]{1});
        return jdbc;
    }

    private McnIncomeRawLedgerEvent fact(String eventId, String revision, String platformUserId, Instant updatedAt, McnIncomeEventType eventType, McnIncomeSettlementStatus settlementStatus) {
        return fact(eventId, revision, platformUserId, DAY, updatedAt, eventType, settlementStatus);
    }

    private McnIncomeRawLedgerEvent fact(String eventId, String revision, String platformUserId, LocalDate businessDate, Instant updatedAt, McnIncomeEventType eventType, McnIncomeSettlementStatus settlementStatus) {
        return McnIncomeRawLedgerEvent.record("MCN", "delivery", "TIMO", "DAILY", eventId, revision, null, platformUserId,
                null, McnIncomeResolutionStatus.UNMATCHED, "not-yet-bound", eventType, settlementStatus, BigDecimal.ONE,
                "USD", "USD", businessDate, "UTC", NOW.minusSeconds(3600), NOW, NOW.minusSeconds(30), null, updatedAt,
                "guild-1", "hash", "{}", NOW, "MCN");
    }
}
