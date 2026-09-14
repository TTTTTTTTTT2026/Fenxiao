package com.fenxiao.income.mcn.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fenxiao.income.mcn.api.dto.McnIncomeControlledReconciliationRequest;
import com.fenxiao.income.mcn.api.dto.McnIncomeControlledReconciliationResponse;
import com.fenxiao.income.mcn.api.dto.McnIncomeControlledChangesRequest;
import com.fenxiao.income.mcn.api.dto.McnIncomeControlledChangesResponse;
import com.fenxiao.income.mcn.external.McnIncomeFactsClient;
import com.fenxiao.income.mcn.external.McnIncomeFactsProperties;
import com.fenxiao.income.mcn.external.McnIncomeFactsReconciliationPage;
import com.fenxiao.income.mcn.external.McnIncomeFactsReconciliationResult;
import com.fenxiao.income.mcn.external.McnIncomeFactsRequestAudit;
import com.fenxiao.income.mcn.external.McnIncomeFactsTransportException;
import com.fenxiao.income.mcn.repository.McnIncomeControlledReadRunRepository;
import com.fenxiao.income.mcn.repository.McnIncomeRawLedgerEventRepository;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class McnIncomeControlledReadOnlyServiceTest {
    private static final LocalDate DAY = LocalDate.of(2026, 9, 11);
    private static final Instant NOW = Instant.parse("2026-09-14T08:00:00Z");

    @Test
    void reconciliationUsesOnlyGloballyLatestFactsForTheSelectedBusinessDate() {
        McnIncomeFactsClient client = mock(McnIncomeFactsClient.class);
        McnIncomeRawLedgerEventRepository events = mock(McnIncomeRawLedgerEventRepository.class);
        McnIncomeControlledReadRunRepository runs = mock(McnIncomeControlledReadRunRepository.class);
        when(client.enabled()).thenReturn(true);
        when(client.reconcile(any())).thenReturn(new McnIncomeFactsReconciliationResult(
                new McnIncomeFactsReconciliationPage("TIMO", "snapshot", NOW, "READY", JsonNodeFactory.instance.objectNode(),
                        DAY, DAY, List.of(), null, "mcn-request"),
                new McnIncomeFactsRequestAudit("mcn-request", "hash", NOW, 200, 20)));
        // The globally latest revision moved this source event to the next business day, so no
        // latest fact remains on DAY. The old date must therefore reconcile as an empty set.
        when(events.findLatestBySourceSystemAndPlatformCodeAndBusinessDateBetween("MCN", "TIMO", DAY, DAY)).thenReturn(List.of());

        McnIncomeControlledReconciliationResponse result = service(client, events, runs).reconcile(
                new McnIncomeControlledReconciliationRequest("TIMO", DAY, DAY, List.of()));

        assertThat(result.sourceStatus()).isEqualTo("READY");
        assertThat(result.comparisonStatus()).isEqualTo("MATCHED");
        verify(events).findLatestBySourceSystemAndPlatformCodeAndBusinessDateBetween("MCN", "TIMO", DAY, DAY);
        verify(events, never()).findBySourceSystemAndPlatformCodeAndBusinessDateBetween(any(), any(), any(), any());
    }

    @Test
    void recordsAndReturnsAContractBackoffForA429WithoutRetryAfter() {
        McnIncomeFactsClient client = mock(McnIncomeFactsClient.class);
        McnIncomeRawLedgerEventRepository events = mock(McnIncomeRawLedgerEventRepository.class);
        McnIncomeControlledReadRunRepository runs = mock(McnIncomeControlledReadRunRepository.class);
        when(client.enabled()).thenReturn(true);
        when(client.query(any(), any())).thenThrow(new McnIncomeFactsTransportException("rate limited", 429, null, null));

        McnIncomeControlledChangesResponse result = service(client, events, runs).readChanges(
                new McnIncomeControlledChangesRequest("TIMO", "cursor-stable", DAY, DAY, 200, "test-429"));

        assertThat(result.httpStatus()).isEqualTo(429);
        assertThat(result.sourceStatus()).isEqualTo("HTTP_429");
        assertThat(result.retryAfterSeconds()).isEqualTo(60);
        assertThat(result.cursorPersisted()).isFalse();
        assertThat(result.nextCursor()).isNull();
        verify(runs).save(any());
    }

    private McnIncomeControlledReadOnlyService service(McnIncomeFactsClient client, McnIncomeRawLedgerEventRepository events,
                                                        McnIncomeControlledReadRunRepository runs) {
        McnIncomeFactsProperties properties = new McnIncomeFactsProperties();
        properties.setControlledReadOnlyEnabled(true);
        properties.setBaseUrl("https://mcn.example.test");
        properties.setCredentialId("credential");
        properties.setHmacSecret("secret");
        return new McnIncomeControlledReadOnlyService(client, properties, mock(McnIncomeRawLedgerService.class), events, runs,
                new ObjectMapper(), Clock.fixed(NOW, ZoneOffset.UTC));
    }
}
