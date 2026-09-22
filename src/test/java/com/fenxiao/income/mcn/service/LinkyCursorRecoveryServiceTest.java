package com.fenxiao.income.mcn.service;

import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.income.mcn.api.dto.LinkyCursorRecoveryProbeRequest;
import com.fenxiao.income.mcn.dto.McnIncomeDeliveryResponse;
import com.fenxiao.income.mcn.entity.McnIncomeSyncCheckpoint;
import com.fenxiao.income.mcn.external.McnIncomeFactsClient;
import com.fenxiao.income.mcn.external.McnIncomeFactsPage;
import com.fenxiao.income.mcn.external.McnIncomeFactsProperties;
import com.fenxiao.income.mcn.external.McnIncomeFactsQuery;
import com.fenxiao.income.mcn.external.McnIncomeFactsReconciliationPage;
import com.fenxiao.income.mcn.external.McnIncomeFactsReconciliationResult;
import com.fenxiao.income.mcn.external.McnIncomeFactsRequestAudit;
import com.fenxiao.income.mcn.repository.McnIncomeRawLedgerEventRepository;
import com.fenxiao.income.mcn.repository.McnIncomeSyncCheckpointRepository;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LinkyCursorRecoveryServiceTest {
    private static final Instant NOW = Instant.parse("2026-09-22T13:10:00Z");

    @Test
    void requiresFinalProbeBeforeItCanResumeTheContinuousStream() {
        McnIncomeFactsClient client = mock(McnIncomeFactsClient.class);
        McnIncomeRawLedgerService raw = mock(McnIncomeRawLedgerService.class);
        McnIncomeRawLedgerEventRepository rawEvents = mock(McnIncomeRawLedgerEventRepository.class);
        McnIncomeSyncCheckpointRepository checkpoints = mock(McnIncomeSyncCheckpointRepository.class);
        OperationAuditLogRepository audits = mock(OperationAuditLogRepository.class);
        ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
        McnIncomeSyncCheckpoint checkpoint = McnIncomeSyncCheckpoint.initial("LINKY");
        checkpoint.advance("expired-cursor", NOW, "{}", NOW);
        checkpoint.cursorExpired("cursor invalid or expired");
        when(checkpoints.findById("LINKY")).thenReturn(Optional.of(checkpoint));
        when(client.enabled()).thenReturn(true);
        when(client.query(any(McnIncomeFactsQuery.class))).thenReturn(finalPage());
        when(client.reconcile(any())).thenReturn(finalReconciliation());
        when(rawEvents.findLatestBySourceSystemAndPlatformCodeAndBusinessDateBetween(any(), any(), any(), any())).thenReturn(List.of());
        when(raw.accept(any())).thenReturn(new McnIncomeDeliveryResponse("delivery", "ACCEPTED", 1, 1, 0, 0));
        LinkyCursorRecoveryService service = service(client, raw, rawEvents, checkpoints, audits, events);

        assertThatThrownBy(() -> service.resumeContinuousSync(actor())).isInstanceOf(IllegalStateException.class);
        var probe = service.probe(new LinkyCursorRecoveryProbeRequest(LocalDate.of(2026, 9, 21)), actor());
        var resumed = service.resumeContinuousSync(actor());

        assertThat(probe.status()).isEqualTo("RECOVERY_PROBE_PASSED");
        assertThat(probe.readyForContinuousRebuild()).isTrue();
        assertThat(resumed.status()).isEqualTo("RECOVERY_RESUMED");
        assertThat(checkpoint.getNextCursor()).isNull();
        verify(raw, times(1)).accept(any());
        verify(events, times(1)).publishEvent(any(McnIncomeFactsAcceptedEvent.class));
    }

    private LinkyCursorRecoveryService service(McnIncomeFactsClient client, McnIncomeRawLedgerService raw, McnIncomeRawLedgerEventRepository rawEvents,
                                               McnIncomeSyncCheckpointRepository checkpoints, OperationAuditLogRepository audits,
                                               ApplicationEventPublisher events) {
        McnIncomeFactsProperties properties = new McnIncomeFactsProperties();
        properties.setEnabled(true); properties.setBaseUrl("https://mcn.example.test");
        properties.setCredentialId("income-reader"); properties.setHmacSecret("secret");
        return new LinkyCursorRecoveryService(client, properties, raw, checkpoints, rawEvents, audits, events, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    private McnIncomeFactsPage finalPage() {
        return new McnIncomeFactsPage("LINKY", "delivery", NOW, "READY",
                JsonNodeFactory.instance.objectNode().put("completeness", "FINAL"), List.of(), null, false, null, "request");
    }

    private McnIncomeFactsReconciliationResult finalReconciliation() {
        return new McnIncomeFactsReconciliationResult(new McnIncomeFactsReconciliationPage("LINKY", "snapshot", NOW,
                "READY", JsonNodeFactory.instance.objectNode().put("completeness", "FINAL"), LocalDate.of(2026, 9, 21),
                LocalDate.of(2026, 9, 21), List.of(), null, "request"),
                new McnIncomeFactsRequestAudit("request", "hash", NOW, 200, 1));
    }

    private AdminSessionService.AdminPrincipal actor() {
        return new AdminSessionService.AdminPrincipal(1L, "finance", "Finance", "finance", false, 1L, false,
                java.time.LocalDateTime.ofInstant(NOW, ZoneOffset.UTC).plusHours(1), null, null, null);
    }
}
