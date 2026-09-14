package com.fenxiao.income.mcn.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fenxiao.income.mcn.dto.McnIncomeDeliveryResponse;
import com.fenxiao.income.mcn.entity.McnIncomeSyncCheckpoint;
import com.fenxiao.income.mcn.external.McnIncomeFactsClient;
import com.fenxiao.income.mcn.external.McnIncomeFactsPage;
import com.fenxiao.income.mcn.external.McnIncomeFactsProperties;
import com.fenxiao.income.mcn.external.McnIncomeFactsQuery;
import com.fenxiao.income.mcn.repository.McnIncomeSyncCheckpointRepository;
import com.fenxiao.income.mcn.repository.McnIncomeSyncRunRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class McnIncomePullServiceTest {
    private static final Instant NOW = Instant.parse("2026-09-14T08:00:00Z");

    @Test
    void drainsAvailablePagesAndUsesTheAdvancedCursorForTheNextPage() {
        McnIncomeFactsClient client = mock(McnIncomeFactsClient.class);
        McnIncomeRawLedgerService rawLedger = mock(McnIncomeRawLedgerService.class);
        McnIncomeSyncCheckpointRepository checkpoints = mock(McnIncomeSyncCheckpointRepository.class);
        McnIncomeSyncRunRepository runs = mock(McnIncomeSyncRunRepository.class);
        AtomicReference<McnIncomeSyncCheckpoint> savedCheckpoint = new AtomicReference<>();
        when(checkpoints.findById("TIMO")).thenAnswer(invocation -> Optional.ofNullable(savedCheckpoint.get()));
        doAnswer(invocation -> {
            savedCheckpoint.set(invocation.getArgument(0));
            return invocation.getArgument(0);
        }).when(checkpoints).save(any(McnIncomeSyncCheckpoint.class));
        when(client.query(any(McnIncomeFactsQuery.class))).thenReturn(
                page("TIMO", "delivery-1", "cursor-2", true),
                page("TIMO", "delivery-2", null, false));
        when(rawLedger.accept(any())).thenReturn(
                new McnIncomeDeliveryResponse("delivery-1", "ACCEPTED", 3, 2, 1, 1),
                new McnIncomeDeliveryResponse("delivery-2", "ACCEPTED", 4, 4, 0, 2));

        McnIncomePullBatchResult result = service(client, rawLedger, checkpoints, runs).pullAvailablePages("timo");

        assertThat(result.status()).isEqualTo("SUCCESS");
        assertThat(result.pageCount()).isEqualTo(2);
        assertThat(result.receivedCount()).isEqualTo(7);
        assertThat(result.newCount()).isEqualTo(6);
        assertThat(result.duplicateCount()).isEqualTo(1);
        assertThat(result.unmatchedCount()).isEqualTo(3);
        assertThat(savedCheckpoint.get().getNextCursor()).isNull();
        ArgumentCaptor<McnIncomeFactsQuery> queries = ArgumentCaptor.forClass(McnIncomeFactsQuery.class);
        verify(client, times(2)).query(queries.capture());
        assertThat(queries.getAllValues()).extracting(McnIncomeFactsQuery::cursor).containsExactly(null, "cursor-2");
    }

    @Test
    void stopsImmediatelyWhenMcnAsksTheConsumerToRetryLater() {
        McnIncomeFactsClient client = mock(McnIncomeFactsClient.class);
        McnIncomeRawLedgerService rawLedger = mock(McnIncomeRawLedgerService.class);
        McnIncomeSyncCheckpointRepository checkpoints = mock(McnIncomeSyncCheckpointRepository.class);
        McnIncomeSyncRunRepository runs = mock(McnIncomeSyncRunRepository.class);
        when(checkpoints.findById("LINKY")).thenReturn(Optional.empty());
        when(client.query(any(McnIncomeFactsQuery.class))).thenReturn(stale("LINKY", 180));

        McnIncomePullBatchResult result = service(client, rawLedger, checkpoints, runs).pullAvailablePages("Linky");

        assertThat(result.status()).isEqualTo("STALE");
        assertThat(result.pageCount()).isEqualTo(1);
        assertThat(result.retryAfterSeconds()).isEqualTo(180);
        verify(rawLedger, times(0)).accept(any());
        verify(client, times(1)).query(any(McnIncomeFactsQuery.class));
    }

    private McnIncomePullService service(McnIncomeFactsClient client, McnIncomeRawLedgerService rawLedger,
                                         McnIncomeSyncCheckpointRepository checkpoints, McnIncomeSyncRunRepository runs) {
        McnIncomeFactsProperties properties = new McnIncomeFactsProperties();
        properties.setEnabled(true);
        properties.setBaseUrl("https://mcn.example.test");
        properties.setCredentialId("test-credential");
        properties.setHmacSecret("test-secret");
        properties.setMaxPagesPerRun(10);
        return new McnIncomePullService(client, properties, rawLedger, checkpoints, runs, new ObjectMapper(),
                Clock.fixed(NOW, ZoneOffset.UTC));
    }

    private McnIncomeFactsPage page(String platform, String deliveryId, String cursor, boolean hasMore) {
        return new McnIncomeFactsPage(platform, deliveryId, NOW, "READY", JsonNodeFactory.instance.objectNode(),
                List.of(), cursor, hasMore, null, "request-" + deliveryId);
    }

    private McnIncomeFactsPage stale(String platform, int retryAfterSeconds) {
        return new McnIncomeFactsPage(platform, null, NOW, "STALE", JsonNodeFactory.instance.objectNode(),
                List.of(), null, false, retryAfterSeconds, "request-stale");
    }
}
