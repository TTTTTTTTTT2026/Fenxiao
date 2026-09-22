package com.fenxiao.income.mcn.service;

import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.audit.entity.OperationAuditLog;
import com.fenxiao.audit.repository.OperationAuditLogRepository;
import com.fenxiao.income.mcn.api.dto.LinkyCursorRecoveryProbeRequest;
import com.fenxiao.income.mcn.api.dto.LinkyCursorRecoveryResponse;
import com.fenxiao.income.mcn.dto.McnIncomeDeliveryRequest;
import com.fenxiao.income.mcn.dto.McnIncomeDeliveryResponse;
import com.fenxiao.income.mcn.entity.McnIncomeSyncCheckpoint;
import com.fenxiao.income.mcn.external.McnIncomeFactsClient;
import com.fenxiao.income.mcn.external.McnIncomeFactsPage;
import com.fenxiao.income.mcn.external.McnIncomeFactsProperties;
import com.fenxiao.income.mcn.external.McnIncomeFactsQuery;
import com.fenxiao.income.mcn.repository.McnIncomeSyncCheckpointRepository;
import jakarta.transaction.Transactional;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

/**
 * Audited recovery for MCN's expiring opaque Linky cursor. It never exposes, creates or guesses
 * a cursor: a bounded FINAL probe must complete before the continuous stream can be restarted.
 */
@Service
@Transactional
public class LinkyCursorRecoveryService {
    private static final String PLATFORM = "LINKY";
    private static final String MODULE = "mcn_income_cursor_recovery";
    private static final int PAGE_SIZE = 500;
    private static final int MAX_PROBE_PAGES = 100;

    private final McnIncomeFactsClient client;
    private final McnIncomeFactsProperties properties;
    private final McnIncomeRawLedgerService rawLedger;
    private final McnIncomeSyncCheckpointRepository checkpoints;
    private final OperationAuditLogRepository audits;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    public LinkyCursorRecoveryService(McnIncomeFactsClient client, McnIncomeFactsProperties properties,
                                      McnIncomeRawLedgerService rawLedger, McnIncomeSyncCheckpointRepository checkpoints,
                                      OperationAuditLogRepository audits, ApplicationEventPublisher events, Clock clock) {
        this.client = client; this.properties = properties; this.rawLedger = rawLedger; this.checkpoints = checkpoints;
        this.audits = audits; this.events = events; this.clock = clock;
    }

    public LinkyCursorRecoveryResponse probe(LinkyCursorRecoveryProbeRequest request, AdminSessionService.AdminPrincipal actor) {
        if (!properties.isContinuousPullEnabled() || !client.enabled()) throw new IllegalStateException("MCN income facts are not configured");
        LocalDate date = request.businessDate();
        McnIncomeSyncCheckpoint checkpoint = requiredExpiredCheckpoint();
        String before = snapshot(checkpoint);
        String cursor = null;
        int pages = 0, received = 0, added = 0, duplicates = 0, unmatched = 0;
        boolean hasMore;
        do {
            if (++pages > MAX_PROBE_PAGES) throw new IllegalStateException("date-bounded recovery probe exceeded safe page limit");
            McnIncomeFactsPage page = client.query(new McnIncomeFactsQuery(PLATFORM, cursor, PAGE_SIZE, date, date));
            if (!page.isReady() || !isFinal(page.sourceWatermark())) throw new IllegalStateException("Linky recovery probe must return READY FINAL facts");
            McnIncomeDeliveryResponse receipt = rawLedger.accept(new McnIncomeDeliveryRequest(page.deliveryId(), "MCN", PLATFORM,
                    page.snapshotAt(), page.sourceWatermark(), page.facts()));
            received += receipt.receivedFactCount(); added += receipt.newFactCount(); duplicates += receipt.duplicateFactCount(); unmatched += receipt.unmatchedFactCount();
            cursor = page.nextCursor(); hasMore = page.hasMore();
            if (hasMore && (cursor == null || cursor.isBlank())) throw new IllegalStateException("Linky response hasMore without nextCursor");
        } while (hasMore);
        checkpoint.recoveryProbePassed(); checkpoints.save(checkpoint);
        if (added > 0) events.publishEvent(new McnIncomeFactsAcceptedEvent(PLATFORM, Set.of(date)));
        audits.save(OperationAuditLog.create(actor.accountId(), actor.role(), MODULE, "mcn_income_sync_checkpoint", 0L,
                "PROBE_FINAL_DATE", before, snapshot(checkpoint) + ";date=" + date + ";pages=" + pages + ";new=" + added,
                null, "日期限定读取完成；未重置持续同步游标，未创建奖励或付款", LocalDateTime.now(clock)));
        return new LinkyCursorRecoveryResponse("RECOVERY_PROBE_PASSED", date, pages, received, added, duplicates, unmatched, true);
    }

    public LinkyCursorRecoveryResponse resumeContinuousSync(AdminSessionService.AdminPrincipal actor) {
        McnIncomeSyncCheckpoint checkpoint = checkpoints.findById(PLATFORM)
                .orElseThrow(() -> new IllegalStateException("Linky sync checkpoint not found"));
        String before = snapshot(checkpoint);
        checkpoint.resumeFromBeginning(); checkpoints.save(checkpoint);
        audits.save(OperationAuditLog.create(actor.accountId(), actor.role(), MODULE, "mcn_income_sync_checkpoint", 0L,
                "RESUME_FROM_NULL_CURSOR", before, snapshot(checkpoint), null,
                "重新建立 Linky 持续修订流；依赖 sourceEventId/sourceRevision 幂等，不创建奖励或付款", LocalDateTime.now(clock)));
        return new LinkyCursorRecoveryResponse("RECOVERY_RESUMED", null, 0, 0, 0, 0, 0, false);
    }

    private McnIncomeSyncCheckpoint requiredExpiredCheckpoint() {
        McnIncomeSyncCheckpoint checkpoint = checkpoints.findById(PLATFORM)
                .orElseThrow(() -> new IllegalStateException("Linky sync checkpoint not found"));
        if (!"CURSOR_EXPIRED".equals(checkpoint.getLastSyncStatus())) throw new IllegalStateException("Linky cursor recovery requires a recorded HTTP 410 cursor expiry");
        return checkpoint;
    }
    private boolean isFinal(com.fasterxml.jackson.databind.JsonNode watermark) { return watermark != null && "FINAL".equalsIgnoreCase(watermark.path("completeness").asText()); }
    private String snapshot(McnIncomeSyncCheckpoint checkpoint) { return "platform=LINKY;status=" + checkpoint.getLastSyncStatus() + ";cursorPresent=" + (checkpoint.getNextCursor() != null && !checkpoint.getNextCursor().isBlank()) + ";error=" + checkpoint.getLastErrorCode(); }
}
