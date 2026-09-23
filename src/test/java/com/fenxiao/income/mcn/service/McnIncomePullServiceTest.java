package com.fenxiao.income.mcn.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fenxiao.income.mcn.dto.McnIncomeDeliveryResponse;
import com.fenxiao.income.mcn.dto.McnIncomeFactRequest;
import com.fenxiao.income.mcn.entity.McnIncomeSyncCheckpoint;
import com.fenxiao.income.mcn.entity.McnIncomeAccountSyncCheckpoint;
import com.fenxiao.income.mcn.external.McnIncomeFactsClient;
import com.fenxiao.income.mcn.external.McnIncomeFactsPage;
import com.fenxiao.income.mcn.external.McnIncomeFactsProperties;
import com.fenxiao.income.mcn.external.McnIncomeFactsQuery;
import com.fenxiao.income.mcn.external.McnIncomeFactsTransportException;
import com.fenxiao.income.mcn.external.McnIncomeFactsReconciliationPage;
import com.fenxiao.income.mcn.external.McnIncomeFactsReconciliationResult;
import com.fenxiao.income.mcn.repository.McnIncomeSyncCheckpointRepository;
import com.fenxiao.income.mcn.repository.McnIncomeAccountSyncCheckpointRepository;
import com.fenxiao.income.mcn.repository.McnIncomeSyncRunRepository;
import com.fenxiao.income.mcn.repository.McnIncomeRawLedgerEventRepository;
import com.fenxiao.platform.domain.PlatformBindingStatus;
import com.fenxiao.platform.entity.PlatformAccountBinding;
import com.fenxiao.platform.repository.PlatformAccountBindingRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
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
        McnIncomeAccountSyncCheckpointRepository accountCheckpoints = mock(McnIncomeAccountSyncCheckpointRepository.class);
        PlatformAccountBindingRepository bindings = bindings();
        McnIncomeSyncRunRepository runs = mock(McnIncomeSyncRunRepository.class);
        AtomicReference<McnIncomeAccountSyncCheckpoint> savedCheckpoint = new AtomicReference<>();
        when(accountCheckpoints.findById("TIMO:123456789012")).thenAnswer(invocation -> Optional.ofNullable(savedCheckpoint.get()));
        doAnswer(invocation -> {
            savedCheckpoint.set(invocation.getArgument(0));
            return invocation.getArgument(0);
        }).when(accountCheckpoints).save(any(McnIncomeAccountSyncCheckpoint.class));
        when(checkpoints.findById("TIMO")).thenReturn(Optional.empty());
        when(client.query(any(McnIncomeFactsQuery.class))).thenReturn(
                page("TIMO", "delivery-1", "cursor-2", true),
                page("TIMO", "delivery-2", "cursor-terminal", false));
        when(rawLedger.accept(any())).thenReturn(
                new McnIncomeDeliveryResponse("delivery-1", "ACCEPTED", 3, 2, 1, 1),
                new McnIncomeDeliveryResponse("delivery-2", "ACCEPTED", 4, 4, 0, 2));

        McnIncomePullBatchResult result = service(client, rawLedger, checkpoints, accountCheckpoints, bindings, runs).pullAvailablePages("timo");

        assertThat(result.status()).isEqualTo("SUCCESS");
        assertThat(result.pageCount()).isEqualTo(2);
        assertThat(result.receivedCount()).isEqualTo(7);
        assertThat(result.newCount()).isEqualTo(6);
        assertThat(result.duplicateCount()).isEqualTo(1);
        assertThat(result.unmatchedCount()).isEqualTo(3);
        assertThat(savedCheckpoint.get().getNextCursor()).isEqualTo("cursor-terminal");
        ArgumentCaptor<McnIncomeFactsQuery> queries = ArgumentCaptor.forClass(McnIncomeFactsQuery.class);
        verify(client, times(2)).query(queries.capture());
        assertThat(queries.getAllValues()).extracting(McnIncomeFactsQuery::cursor).containsExactly(null, "cursor-2");
    }

    @Test
    void stopsImmediatelyWhenMcnAsksTheConsumerToRetryLater() {
        McnIncomeFactsClient client = mock(McnIncomeFactsClient.class);
        McnIncomeRawLedgerService rawLedger = mock(McnIncomeRawLedgerService.class);
        McnIncomeSyncCheckpointRepository checkpoints = mock(McnIncomeSyncCheckpointRepository.class);
        McnIncomeAccountSyncCheckpointRepository accountCheckpoints = mock(McnIncomeAccountSyncCheckpointRepository.class);
        PlatformAccountBindingRepository bindings = bindings();
        McnIncomeSyncRunRepository runs = mock(McnIncomeSyncRunRepository.class);
        when(accountCheckpoints.findById("LINKY:01234567")).thenReturn(Optional.empty());
        when(checkpoints.findById("LINKY")).thenReturn(Optional.empty());
        when(client.query(any(McnIncomeFactsQuery.class))).thenReturn(stale("LINKY", 180));

        McnIncomePullBatchResult result = service(client, rawLedger, checkpoints, accountCheckpoints, bindings, runs).pullAvailablePages("Linky");

        assertThat(result.status()).isEqualTo("STALE");
        assertThat(result.pageCount()).isEqualTo(1);
        assertThat(result.retryAfterSeconds()).isEqualTo(180);
        verify(rawLedger, times(0)).accept(any());
        verify(client, times(1)).query(any(McnIncomeFactsQuery.class));
    }

    @Test
    void keepsTheCursorAndUsesTheContractFallbackWhenMcnRateLimitsWithoutRetryAfter() {
        McnIncomeFactsClient client = mock(McnIncomeFactsClient.class);
        McnIncomeRawLedgerService rawLedger = mock(McnIncomeRawLedgerService.class);
        McnIncomeSyncCheckpointRepository checkpoints = mock(McnIncomeSyncCheckpointRepository.class);
        McnIncomeAccountSyncCheckpointRepository accountCheckpoints = mock(McnIncomeAccountSyncCheckpointRepository.class);
        PlatformAccountBindingRepository bindings = bindings();
        McnIncomeSyncRunRepository runs = mock(McnIncomeSyncRunRepository.class);
        McnIncomeAccountSyncCheckpoint checkpoint = McnIncomeAccountSyncCheckpoint.initial("TIMO", "123456789012");
        checkpoint.advance("cursor-stable", NOW, "{}", NOW);
        when(accountCheckpoints.findById("TIMO:123456789012")).thenReturn(Optional.of(checkpoint));
        when(client.query(any(McnIncomeFactsQuery.class))).thenThrow(new McnIncomeFactsTransportException("rate limited", 429, null, null));

        when(checkpoints.findById("TIMO")).thenReturn(Optional.empty());
        McnIncomePullResult result = service(client, rawLedger, checkpoints, accountCheckpoints, bindings, runs).pullNextPage("TIMO");

        assertThat(result.status()).isEqualTo("THROTTLED");
        assertThat(result.retryAfterSeconds()).isEqualTo(60);
        assertThat(checkpoint.getNextCursor()).isEqualTo("cursor-stable");
        assertThat(checkpoint.getNextAttemptAt()).isEqualTo(NOW.plusSeconds(60));
        verify(rawLedger, times(0)).accept(any());
    }

    @Test
    void doesNotAcceptOrAdvanceAReadyPageUntilTheDailyWatermarkIsFinal() {
        McnIncomeFactsClient client = mock(McnIncomeFactsClient.class);
        McnIncomeRawLedgerService rawLedger = mock(McnIncomeRawLedgerService.class);
        McnIncomeSyncCheckpointRepository checkpoints = mock(McnIncomeSyncCheckpointRepository.class);
        McnIncomeAccountSyncCheckpointRepository accountCheckpoints = mock(McnIncomeAccountSyncCheckpointRepository.class);
        PlatformAccountBindingRepository bindings = bindings();
        McnIncomeSyncRunRepository runs = mock(McnIncomeSyncRunRepository.class);
        McnIncomeAccountSyncCheckpoint checkpoint = McnIncomeAccountSyncCheckpoint.initial("TIMO", "123456789012");
        checkpoint.advance("cursor-stable", NOW, "{}", NOW);
        when(accountCheckpoints.findById("TIMO:123456789012")).thenReturn(Optional.of(checkpoint));
        when(client.query(any(McnIncomeFactsQuery.class))).thenReturn(pageWithCompleteness("TIMO", "delivery-provisional", "cursor-next", true, "PROVISIONAL"));

        McnIncomePullResult result = service(client, rawLedger, checkpoints, accountCheckpoints, bindings, runs).pullNextPage("TIMO");

        assertThat(result.status()).isEqualTo("WAITING_FINALITY");
        assertThat(result.retryAfterSeconds()).isEqualTo(900);
        assertThat(checkpoint.getNextCursor()).isEqualTo("cursor-stable");
        assertThat(checkpoint.getLastSyncStatus()).isEqualTo("WAITING_FINALITY");
        assertThat(checkpoint.getNextAttemptAt()).isEqualTo(NOW.plusSeconds(900));
        verify(rawLedger, times(0)).accept(any());
    }

    @Test
    void defersWithoutCallingMcnBeforeTheStoredRetryTime() {
        McnIncomeFactsClient client = mock(McnIncomeFactsClient.class);
        McnIncomeRawLedgerService rawLedger = mock(McnIncomeRawLedgerService.class);
        McnIncomeSyncCheckpointRepository checkpoints = mock(McnIncomeSyncCheckpointRepository.class);
        McnIncomeAccountSyncCheckpointRepository accountCheckpoints = mock(McnIncomeAccountSyncCheckpointRepository.class);
        PlatformAccountBindingRepository bindings = bindings();
        McnIncomeSyncRunRepository runs = mock(McnIncomeSyncRunRepository.class);
        McnIncomeAccountSyncCheckpoint checkpoint = McnIncomeAccountSyncCheckpoint.initial("LINKY", "01234567");
        checkpoint.defer("WAITING_FINALITY", "{\"completeness\":\"PROVISIONAL\"}", NOW.plusSeconds(180));
        when(accountCheckpoints.findById("LINKY:01234567")).thenReturn(Optional.of(checkpoint));

        McnIncomePullResult result = service(client, rawLedger, checkpoints, accountCheckpoints, bindings, runs).pullNextPage("LINKY");

        assertThat(result.status()).isEqualTo("DEFERRED");
        assertThat(result.retryAfterSeconds()).isEqualTo(180);
        verify(client, times(0)).query(any());
        verify(rawLedger, times(0)).accept(any());
    }

    private McnIncomePullService service(McnIncomeFactsClient client, McnIncomeRawLedgerService rawLedger,
                                         McnIncomeSyncCheckpointRepository checkpoints,
                                         McnIncomeAccountSyncCheckpointRepository accountCheckpoints,
                                         PlatformAccountBindingRepository bindings,
                                         McnIncomeSyncRunRepository runs) {
        McnIncomeFactsProperties properties = new McnIncomeFactsProperties();
        properties.setEnabled(true);
        properties.setBaseUrl("https://mcn.example.test");
        properties.setCredentialId("test-credential");
        properties.setHmacSecret("test-secret");
        properties.setMaxPagesPerRun(10);
        return new McnIncomePullService(client, properties, rawLedger, checkpoints, accountCheckpoints, bindings, runs,
                mock(McnIncomeRawLedgerEventRepository.class), mock(org.springframework.context.ApplicationEventPublisher.class), new ObjectMapper(),
                Clock.fixed(NOW, ZoneOffset.UTC));
    }

    @Test
    void expiredPositionStartsBoundedRecoveryAndNeverRetriesTheOldPosition() {
        McnIncomeFactsClient client = mock(McnIncomeFactsClient.class);
        McnIncomeRawLedgerService rawLedger = mock(McnIncomeRawLedgerService.class);
        McnIncomeSyncCheckpointRepository checkpoints = mock(McnIncomeSyncCheckpointRepository.class);
        McnIncomeAccountSyncCheckpointRepository accountCheckpoints = mock(McnIncomeAccountSyncCheckpointRepository.class);
        McnIncomeAccountSyncCheckpoint checkpoint = McnIncomeAccountSyncCheckpoint.initial("TIMO", "123456789012");
        checkpoint.recordHistoryStart(LocalDate.of(2026, 8, 1), null);
        checkpoint.advance("expired-position", NOW, "{}", NOW);
        when(accountCheckpoints.findById("TIMO:123456789012")).thenReturn(Optional.of(checkpoint));
        when(client.query(any(McnIncomeFactsQuery.class))).thenThrow(
                new McnIncomeFactsTransportException("expired", 410, null, null));

        McnIncomePullService service = service(client, rawLedger, checkpoints, accountCheckpoints, bindings(),
                mock(McnIncomeSyncRunRepository.class));
        assertThat(service.pullNextPage("TIMO").status()).isEqualTo("SUCCESS");
        assertThat(checkpoint.getNextCursor()).isNull();
        assertThat(checkpoint.getRecoveryStage()).isEqualTo("WINDOW_READ");
        assertThat(checkpoint.getRecoveryFrom()).isEqualTo(LocalDate.of(2026, 8, 1));
        assertThat(checkpoint.getRecoveryWindowEnd()).isEqualTo(LocalDate.of(2026, 8, 31));

        service.pullNextPage("TIMO");
        ArgumentCaptor<McnIncomeFactsQuery> queries = ArgumentCaptor.forClass(McnIncomeFactsQuery.class);
        verify(client, times(2)).query(queries.capture());
        assertThat(queries.getAllValues().get(0).cursor()).isEqualTo("expired-position");
        assertThat(queries.getAllValues().get(1).cursor()).isNull();
        assertThat(queries.getAllValues().get(1).businessDateFrom()).isEqualTo(LocalDate.of(2026, 8, 1));
    }

    @Test
    void recoveryReconcilesTheTerminalWindowBeforeStartingAnUndatedStream() {
        McnIncomeFactsClient client = mock(McnIncomeFactsClient.class);
        McnIncomeRawLedgerService rawLedger = mock(McnIncomeRawLedgerService.class);
        McnIncomeSyncCheckpointRepository checkpoints = mock(McnIncomeSyncCheckpointRepository.class);
        McnIncomeAccountSyncCheckpointRepository accountCheckpoints = mock(McnIncomeAccountSyncCheckpointRepository.class);
        McnIncomeAccountSyncCheckpoint checkpoint = McnIncomeAccountSyncCheckpoint.initial("TIMO", "123456789012");
        checkpoint.beginRecovery(LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 31));
        when(accountCheckpoints.findById("TIMO:123456789012")).thenReturn(Optional.of(checkpoint));
        when(client.query(any(McnIncomeFactsQuery.class))).thenReturn(page("TIMO", "window-delivery", "window-terminal", false),
                page("TIMO", "stream-delivery", "stream-terminal", false));
        when(rawLedger.accept(any())).thenReturn(new McnIncomeDeliveryResponse("delivery", "ACCEPTED", 0, 0, 0, 0));
        var watermark = JsonNodeFactory.instance.objectNode().put("completeness", "FINAL").put("historyStart", "2026-08-01");
        when(client.reconcile(any())).thenReturn(new McnIncomeFactsReconciliationResult(
                new McnIncomeFactsReconciliationPage("TIMO", "snapshot", NOW, "READY", watermark,
                        LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 31), List.of(), null, "request", "a".repeat(64),
                        List.of("123456789012")), null));
        McnIncomeRawLedgerEventRepository events = mock(McnIncomeRawLedgerEventRepository.class);
        when(events.findLatestBySourceSystemAndPlatformCodeAndBusinessDateBetween(any(), any(), any(), any()))
                .thenReturn(List.of());
        McnIncomeFactsProperties properties = new McnIncomeFactsProperties();
        properties.setEnabled(true); properties.setBaseUrl("https://mcn.example.test");
        properties.setCredentialId("test-credential"); properties.setHmacSecret("test-secret");
        McnIncomePullService service = new McnIncomePullService(client, properties, rawLedger, checkpoints,
                accountCheckpoints, bindings(), mock(McnIncomeSyncRunRepository.class), events,
                mock(org.springframework.context.ApplicationEventPublisher.class), new ObjectMapper(),
                Clock.fixed(NOW, ZoneOffset.UTC));

        service.pullNextPage("TIMO");
        assertThat(checkpoint.getRecoveryStage()).isEqualTo("WINDOW_RECONCILE");
        assertThat(checkpoint.getRecoveryCursor()).isEqualTo("window-terminal");
        service.pullNextPage("TIMO");
        assertThat(checkpoint.getRecoveryStage()).isEqualTo("STREAM_RESTART");
        service.pullNextPage("TIMO");
        assertThat(checkpoint.getRecoveryStage()).isNull();
        ArgumentCaptor<McnIncomeFactsQuery> queries = ArgumentCaptor.forClass(McnIncomeFactsQuery.class);
        verify(client, times(2)).query(queries.capture());
        assertThat(queries.getAllValues().get(0).businessDateFrom()).isEqualTo(LocalDate.of(2026, 8, 1));
        assertThat(queries.getAllValues().get(1).businessDateFrom()).isNull();
        assertThat(queries.getAllValues().get(1).cursor()).isNull();
    }

    @Test
    void acceptedV2FactsTriggerTheExistingBusinessFactPipeline() {
        McnIncomeFactsClient client = mock(McnIncomeFactsClient.class);
        McnIncomeRawLedgerService rawLedger = mock(McnIncomeRawLedgerService.class);
        McnIncomeSyncCheckpointRepository checkpoints = mock(McnIncomeSyncCheckpointRepository.class);
        McnIncomeAccountSyncCheckpointRepository accountCheckpoints = mock(McnIncomeAccountSyncCheckpointRepository.class);
        McnIncomeSyncRunRepository runs = mock(McnIncomeSyncRunRepository.class);
        ApplicationEventPublisher publisher = mock(ApplicationEventPublisher.class);
        McnIncomeFactRequest fact = mock(McnIncomeFactRequest.class);
        LocalDate businessDate = LocalDate.of(2026, 9, 13);
        when(fact.platformUserId()).thenReturn("01234567");
        when(fact.businessDate()).thenReturn(businessDate);
        when(accountCheckpoints.findById("LINKY:01234567")).thenReturn(Optional.empty());
        when(checkpoints.findById("LINKY")).thenReturn(Optional.empty());
        when(client.query(any(McnIncomeFactsQuery.class))).thenReturn(new McnIncomeFactsPage("LINKY", "delivery", NOW,
                "READY", JsonNodeFactory.instance.objectNode().put("completeness", "FINAL").put("historyStart", "2026-08-01"),
                List.of(fact), "next-position", false, null, "request", "a".repeat(64), List.of("01234567")));
        when(rawLedger.accept(any())).thenReturn(new McnIncomeDeliveryResponse("delivery", "ACCEPTED", 1, 1, 0, 0));
        McnIncomeFactsProperties properties = new McnIncomeFactsProperties();
        properties.setEnabled(true); properties.setBaseUrl("https://mcn.example.test");
        properties.setCredentialId("test-credential"); properties.setHmacSecret("test-secret");
        McnIncomePullService service = new McnIncomePullService(client, properties, rawLedger, checkpoints,
                accountCheckpoints, bindings(), runs, mock(McnIncomeRawLedgerEventRepository.class),
                publisher, new ObjectMapper(), Clock.fixed(NOW, ZoneOffset.UTC));

        assertThat(service.pullNextPage("LINKY").status()).isEqualTo("SUCCESS");
        ArgumentCaptor<McnIncomeFactsAcceptedEvent> event = ArgumentCaptor.forClass(McnIncomeFactsAcceptedEvent.class);
        verify(publisher).publishEvent(event.capture());
        assertThat(event.getValue().platformCode()).isEqualTo("LINKY");
        assertThat(event.getValue().businessDates()).containsExactly(businessDate);
    }

    private PlatformAccountBindingRepository bindings() {
        PlatformAccountBindingRepository repository = mock(PlatformAccountBindingRepository.class);
        PlatformAccountBinding timo = mock(PlatformAccountBinding.class);
        when(timo.getPlatformUserId()).thenReturn("123456789012");
        PlatformAccountBinding linky = mock(PlatformAccountBinding.class);
        when(linky.getPlatformUserId()).thenReturn("01234567");
        when(repository.findByBindingStatusAndPlatformCode(PlatformBindingStatus.VERIFIED, "TIMO")).thenReturn(List.of(timo));
        when(repository.findByBindingStatusAndPlatformCode(PlatformBindingStatus.VERIFIED, "LINKY")).thenReturn(List.of(linky));
        return repository;
    }

    private McnIncomeFactsPage page(String platform, String deliveryId, String cursor, boolean hasMore) {
        return pageWithCompleteness(platform, deliveryId, cursor, hasMore, "FINAL");
    }

    private McnIncomeFactsPage pageWithCompleteness(String platform, String deliveryId, String cursor, boolean hasMore, String completeness) {
        return new McnIncomeFactsPage(platform, deliveryId, NOW, "READY", JsonNodeFactory.instance.objectNode()
                .put("completeness", completeness).put("historyStart", "2026-08-01"),
                List.of(), cursor, hasMore, null, "request-" + deliveryId, "a".repeat(64),
                List.of("TIMO".equals(platform) ? "123456789012" : "01234567"));
    }

    private McnIncomeFactsPage stale(String platform, int retryAfterSeconds) {
        return new McnIncomeFactsPage(platform, null, NOW, "STALE", JsonNodeFactory.instance.objectNode(),
                List.of(), null, false, retryAfterSeconds, "request-stale", "a".repeat(64),
                List.of("TIMO".equals(platform) ? "123456789012" : "01234567"));
    }
}
