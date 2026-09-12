package com.fenxiao.income.mcn.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fenxiao.income.mcn.dto.McnIncomeDeliveryRequest;
import com.fenxiao.income.mcn.dto.McnIncomeDeliveryResponse;
import com.fenxiao.income.mcn.entity.McnIncomeSyncCheckpoint;
import com.fenxiao.income.mcn.entity.McnIncomeSyncRun;
import com.fenxiao.income.mcn.external.McnIncomeFactsClient;
import com.fenxiao.income.mcn.external.McnIncomeFactsPage;
import com.fenxiao.income.mcn.external.McnIncomeFactsProperties;
import com.fenxiao.income.mcn.external.McnIncomeFactsQuery;
import com.fenxiao.income.mcn.external.McnIncomeFactsTransportException;
import com.fenxiao.income.mcn.repository.McnIncomeSyncCheckpointRepository;
import com.fenxiao.income.mcn.repository.McnIncomeSyncRunRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

/** Pulls one authoritative MCN page and advances the durable cursor only after raw-ledger acceptance. */
@Service
@Transactional
public class McnIncomePullService {
    private final McnIncomeFactsClient client;
    private final McnIncomeFactsProperties properties;
    private final McnIncomeRawLedgerService rawLedgerService;
    private final McnIncomeSyncCheckpointRepository checkpointRepository;
    private final McnIncomeSyncRunRepository runRepository;
    private final ObjectMapper json;
    private final Clock clock;

    public McnIncomePullService(McnIncomeFactsClient client, McnIncomeFactsProperties properties,
                                McnIncomeRawLedgerService rawLedgerService,
                                McnIncomeSyncCheckpointRepository checkpointRepository,
                                McnIncomeSyncRunRepository runRepository, ObjectMapper json, Clock clock) {
        this.client = client;
        this.properties = properties;
        this.rawLedgerService = rawLedgerService;
        this.checkpointRepository = checkpointRepository;
        this.runRepository = runRepository;
        this.json = json;
        this.clock = clock;
    }

    public synchronized McnIncomePullResult pullNextPage(String requestedPlatform) {
        String platform = normalizePlatform(requestedPlatform);
        if (!client.enabled()) {
            throw new IllegalStateException("MCN income facts pull is disabled or not configured");
        }
        McnIncomeSyncCheckpoint checkpoint = checkpointRepository.findById(platform)
                .orElseGet(() -> McnIncomeSyncCheckpoint.initial(platform));
        String requestedCursor = checkpoint.getNextCursor();
        String runId = UUID.randomUUID().toString();
        Instant now = clock.instant();
        try {
            McnIncomeFactsPage page = client.query(new McnIncomeFactsQuery(platform, requestedCursor,
                    properties.getPageSize(), null, null));
            String watermark = json(page.sourceWatermark());
            if (page.isStale()) {
                checkpoint.markStale(watermark);
                checkpointRepository.save(checkpoint);
                runRepository.save(McnIncomeSyncRun.stale(runId, platform, requestedCursor, page.requestId(),
                        watermark, page.retryAfterSeconds(), now));
                return new McnIncomePullResult(platform, "STALE", null, 0, 0, 0, 0, false, page.retryAfterSeconds());
            }
            if (!page.isReady()) {
                throw new IllegalStateException("MCN income facts response status is unsupported");
            }
            McnIncomeDeliveryResponse receipt = rawLedgerService.accept(new McnIncomeDeliveryRequest(
                    page.deliveryId(), "MCN", platform, page.snapshotAt(), page.sourceWatermark(), page.facts()));
            checkpoint.advance(page.nextCursor(), page.snapshotAt(), watermark, now);
            checkpointRepository.save(checkpoint);
            runRepository.save(McnIncomeSyncRun.success(runId, platform, requestedCursor, page.deliveryId(),
                    page.requestId(), receipt.receivedFactCount(), receipt.newFactCount(), receipt.duplicateFactCount(),
                    receipt.unmatchedFactCount(), page.snapshotAt(), watermark, now));
            return new McnIncomePullResult(platform, "SUCCESS", page.deliveryId(), receipt.receivedFactCount(),
                    receipt.newFactCount(), receipt.duplicateFactCount(), receipt.unmatchedFactCount(), page.hasMore(), null);
        } catch (McnIncomeFactsTransportException exception) {
            checkpoint.fail("HTTP_" + exception.getStatusCode(), exception.getMessage());
            checkpointRepository.save(checkpoint);
            runRepository.save(McnIncomeSyncRun.failed(runId, platform, requestedCursor,
                    "HTTP_" + exception.getStatusCode(), exception.getMessage(), exception.getRetryAfterSeconds(), now));
            return new McnIncomePullResult(platform, "FAILED", null, 0, 0, 0, 0, false, exception.getRetryAfterSeconds());
        } catch (RuntimeException exception) {
            checkpoint.fail("PROCESSING_ERROR", exception.getMessage());
            checkpointRepository.save(checkpoint);
            runRepository.save(McnIncomeSyncRun.failed(runId, platform, requestedCursor,
                    "PROCESSING_ERROR", exception.getMessage(), null, now));
            return new McnIncomePullResult(platform, "FAILED", null, 0, 0, 0, 0, false, null);
        }
    }

    private String normalizePlatform(String value) {
        String platform = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        if (!"TIMO".equals(platform) && !"LINKY".equals(platform)) {
            throw new IllegalArgumentException("income platform must be TIMO or LINKY");
        }
        return platform;
    }

    private String json(Object value) {
        try { return json.writeValueAsString(value); }
        catch (JsonProcessingException exception) { throw new IllegalStateException("MCN income watermark cannot be serialized", exception); }
    }
}
