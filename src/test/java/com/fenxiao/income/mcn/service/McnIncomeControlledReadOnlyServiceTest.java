package com.fenxiao.income.mcn.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fenxiao.income.mcn.api.dto.McnIncomeControlledReconciliationRequest;
import com.fenxiao.income.mcn.api.dto.McnIncomeControlledChangesRequest;
import com.fenxiao.income.mcn.external.McnIncomeFactsClient;
import com.fenxiao.income.mcn.external.McnIncomeFactsProperties;
import com.fenxiao.income.mcn.external.McnIncomeFactsReconciliationGroup;
import com.fenxiao.income.mcn.external.McnIncomeFactsReconciliationPage;
import com.fenxiao.income.mcn.entity.McnIncomeRawLedgerEvent;
import com.fenxiao.income.mcn.domain.McnIncomeSettlementStatus;
import com.fenxiao.income.mcn.repository.McnIncomeControlledReadRunRepository;
import com.fenxiao.income.mcn.repository.McnIncomeRawLedgerEventRepository;
import com.fenxiao.platform.repository.PlatformAccountBindingRepository;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.assertj.core.api.Assertions.assertThat;

class McnIncomeControlledReadOnlyServiceTest {
    private static final LocalDate DAY = LocalDate.of(2026, 9, 11);
    private static final Instant NOW = Instant.parse("2026-09-14T08:00:00Z");

    @Test
    void reconciliationRequiresThePublishedChecksumAsWellAsTotals() {
        McnIncomeRawLedgerEventRepository events = mock(McnIncomeRawLedgerEventRepository.class);
        McnIncomeRawLedgerEvent fact = mock(McnIncomeRawLedgerEvent.class);
        when(fact.getPlatformUserId()).thenReturn("123456789012");
        when(fact.getBusinessDate()).thenReturn(DAY);
        when(fact.getGuildId()).thenReturn("43536425");
        when(fact.getSettlementStatus()).thenReturn(McnIncomeSettlementStatus.SETTLED);
        when(fact.getAmountUnit()).thenReturn("TIMO_DIAMOND");
        when(fact.getCurrencyCode()).thenReturn("XXX");
        when(fact.getSourceEventId()).thenReturn("evt-a");
        when(fact.getSourceRevision()).thenReturn("rev-1");
        when(fact.getAmount()).thenReturn(new BigDecimal("12.500"));
        when(events.findLatestBySourceSystemAndPlatformCodeAndBusinessDateBetween("MCN", "TIMO", DAY, DAY))
                .thenReturn(List.of(fact));
        String checksum = McnIncomeReconciliationChecksum.ofEvents(List.of(fact));
        McnIncomeFactsReconciliationPage page = new McnIncomeFactsReconciliationPage("TIMO", "snapshot", NOW,
                "READY", JsonNodeFactory.instance.objectNode().put("completeness", "FINAL"), DAY, DAY,
                List.of(new McnIncomeFactsReconciliationGroup(DAY, "43536425", "SETTLED", "TIMO_DIAMOND",
                        "XXX", 1, new BigDecimal("12.5"), checksum)), null, "request", "a".repeat(64),
                List.of("123456789012"));
        assertThat(McnIncomeControlledReadOnlyService.compare(page, "TIMO", List.of(),
                List.of("123456789012"), events).status()).isEqualTo("MATCHED");
        McnIncomeFactsReconciliationPage wrongChecksum = new McnIncomeFactsReconciliationPage("TIMO", "snapshot", NOW,
                "READY", page.sourceWatermark(), DAY, DAY,
                List.of(new McnIncomeFactsReconciliationGroup(DAY, "43536425", "SETTLED", "TIMO_DIAMOND",
                        "XXX", 1, new BigDecimal("12.5"), "0".repeat(64))), null, "request", "a".repeat(64),
                List.of("123456789012"));
        assertThat(McnIncomeControlledReadOnlyService.compare(wrongChecksum, "TIMO", List.of(),
                List.of("123456789012"), events).status()).isEqualTo("MISMATCH");
    }

    @Test
    void pausesPlatformWideReconciliationUntilTheMcnQueryCanBeAccountScoped() {
        McnIncomeFactsClient client = mock(McnIncomeFactsClient.class);
        McnIncomeRawLedgerEventRepository events = mock(McnIncomeRawLedgerEventRepository.class);
        McnIncomeControlledReadRunRepository runs = mock(McnIncomeControlledReadRunRepository.class);
        when(client.enabled()).thenReturn(true);
        assertThatThrownBy(() -> service(client, events, runs).reconcile(
                new McnIncomeControlledReconciliationRequest("TIMO", DAY, DAY, List.of())))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("disabled or not configured");

        verify(client, never()).reconcile(any());
        verify(events, never()).findLatestBySourceSystemAndPlatformCodeAndBusinessDateBetween(any(), any(), any(), any());
        verifyNoInteractions(runs);
    }

    @Test
    void pausesPlatformWideManualReadsUntilTheMcnQueryCanBeAccountScoped() {
        McnIncomeFactsClient client = mock(McnIncomeFactsClient.class);
        McnIncomeRawLedgerEventRepository events = mock(McnIncomeRawLedgerEventRepository.class);
        McnIncomeControlledReadRunRepository runs = mock(McnIncomeControlledReadRunRepository.class);
        when(client.enabled()).thenReturn(true);
        assertThatThrownBy(() -> service(client, events, runs).readChanges(
                new McnIncomeControlledChangesRequest("TIMO", "cursor-stable", DAY, DAY, 200, "test-429")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("disabled or not configured");

        verify(client, never()).query(any(), any());
        verify(runs, never()).save(any());
    }

    private McnIncomeControlledReadOnlyService service(McnIncomeFactsClient client, McnIncomeRawLedgerEventRepository events,
                                                        McnIncomeControlledReadRunRepository runs) {
        McnIncomeFactsProperties properties = new McnIncomeFactsProperties();
        properties.setBaseUrl("https://mcn.example.test");
        properties.setCredentialId("credential");
        properties.setHmacSecret("secret");
        return new McnIncomeControlledReadOnlyService(client, properties, mock(McnIncomeRawLedgerService.class), events,
                mock(PlatformAccountBindingRepository.class), runs,
                new ObjectMapper(), Clock.fixed(NOW, ZoneOffset.UTC));
    }
}
