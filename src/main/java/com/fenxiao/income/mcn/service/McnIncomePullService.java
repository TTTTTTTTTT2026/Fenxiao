package com.fenxiao.income.mcn.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fenxiao.income.mcn.dto.McnIncomeDeliveryRequest;
import com.fenxiao.income.mcn.dto.McnIncomeDeliveryResponse;
import com.fenxiao.income.mcn.entity.McnIncomeSyncCheckpoint;
import com.fenxiao.income.mcn.entity.McnIncomeAccountSyncCheckpoint;
import com.fenxiao.income.mcn.entity.McnIncomeSyncRun;
import com.fenxiao.income.mcn.external.McnIncomeFactsClient;
import com.fenxiao.income.mcn.external.McnIncomeFactsPage;
import com.fenxiao.income.mcn.external.McnIncomeFactsProperties;
import com.fenxiao.income.mcn.external.McnIncomeFactsQuery;
import com.fenxiao.income.mcn.external.McnIncomeFactsTransportException;
import com.fenxiao.income.mcn.external.McnIncomeFactsReconciliationPage;
import com.fenxiao.income.mcn.external.McnIncomeFactsReconciliationQuery;
import com.fenxiao.income.mcn.repository.McnIncomeSyncCheckpointRepository;
import com.fenxiao.income.mcn.repository.McnIncomeAccountSyncCheckpointRepository;
import com.fenxiao.income.mcn.repository.McnIncomeSyncRunRepository;
import com.fenxiao.income.mcn.repository.McnIncomeRawLedgerEventRepository;
import com.fenxiao.platform.domain.PlatformBindingStatus;
import com.fenxiao.platform.entity.PlatformAccountBinding;
import com.fenxiao.platform.repository.PlatformAccountBindingRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Locale;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.LinkedHashSet;
import java.util.Set;

/** Pulls one authoritative MCN page and advances the durable cursor only after raw-ledger acceptance. */
@Service
public class McnIncomePullService {
    private final McnIncomeFactsClient client;
    private final McnIncomeFactsProperties properties;
    private final McnIncomeRawLedgerService rawLedgerService;
    private final McnIncomeSyncCheckpointRepository checkpointRepository;
    private final McnIncomeAccountSyncCheckpointRepository accountCheckpointRepository;
    private final PlatformAccountBindingRepository bindingRepository;
    private final McnIncomeSyncRunRepository runRepository;
    private final McnIncomeRawLedgerEventRepository eventRepository;
    private final ApplicationEventPublisher events;
    private final ObjectMapper json;
    private final Clock clock;

    public McnIncomePullService(McnIncomeFactsClient client, McnIncomeFactsProperties properties,
                                McnIncomeRawLedgerService rawLedgerService,
                                McnIncomeSyncCheckpointRepository checkpointRepository,
                                McnIncomeAccountSyncCheckpointRepository accountCheckpointRepository,
                                PlatformAccountBindingRepository bindingRepository,
                                McnIncomeSyncRunRepository runRepository, McnIncomeRawLedgerEventRepository eventRepository,
                                ApplicationEventPublisher events,
                                ObjectMapper json, Clock clock) {
        this.client = client;
        this.properties = properties;
        this.rawLedgerService = rawLedgerService;
        this.checkpointRepository = checkpointRepository;
        this.accountCheckpointRepository = accountCheckpointRepository;
        this.bindingRepository = bindingRepository;
        this.runRepository = runRepository;
        this.eventRepository = eventRepository;
        this.events = events;
        this.json = json;
        this.clock = clock;
    }

    public synchronized McnIncomePullResult pullNextPage(String requestedPlatform) {
        String platform = normalizePlatform(requestedPlatform);
        if (!properties.isContinuousPullEnabled()) {
            throw new IllegalStateException("MCN income facts continuous pull is disabled or not configured");
        }
        List<PlatformAccountBinding> accounts = verifiedAccounts(platform);
        if (accounts.isEmpty()) return new McnIncomePullResult(platform, "EMPTY_SCOPE", null, 0, 0, 0, 0, false, null);
        PlatformAccountBinding account = accounts.stream().min(Comparator.comparing(binding -> accountCheckpointRepository
                .findById(McnIncomeAccountSyncCheckpoint.key(platform, binding.getPlatformUserId()))
                .map(McnIncomeAccountSyncCheckpoint::getLastSuccessAt).orElse(null), Comparator.nullsFirst(Comparator.naturalOrder()))).orElseThrow();
        return pullNextPage(platform, account.getPlatformUserId());
    }

    private McnIncomePullResult pullNextPage(String platform, String platformUserId) {
        McnIncomeAccountSyncCheckpoint checkpoint = accountCheckpointRepository.findById(McnIncomeAccountSyncCheckpoint.key(platform, platformUserId))
                .orElseGet(() -> McnIncomeAccountSyncCheckpoint.initial(platform, platformUserId));
        String requestedCursor = checkpoint.getNextCursor();
        String runId = UUID.randomUUID().toString();
        Instant now = clock.instant();
        if (!checkpoint.canAttemptAt(now)) {
            return new McnIncomePullResult(platform, "DEFERRED", null, 0, 0, 0, 0, false,
                    secondsUntil(checkpoint.getNextAttemptAt(), now));
        }
        if ("BLOCKED".equals(checkpoint.getRecoveryStage())) {
            return new McnIncomePullResult(platform, "FAILED", null, 0, 0, 0, 0, false, null);
        }
        try {
            if ("WINDOW_RECONCILE".equals(checkpoint.getRecoveryStage())) {
                return reconcileRecoveryWindow(platform, platformUserId, checkpoint, now);
            }
            boolean windowRead = "WINDOW_READ".equals(checkpoint.getRecoveryStage());
            String queryCursor = windowRead ? checkpoint.getRecoveryCursor() : requestedCursor;
            McnIncomeFactsPage page = client.query(new McnIncomeFactsQuery(platform, List.of(platformUserId), queryCursor,
                    properties.getPageSize(), windowRead ? checkpoint.getRecoveryFrom() : null,
                    windowRead ? checkpoint.getRecoveryWindowEnd() : null));
            String watermark = json(page.sourceWatermark());
            if (page.isStale()) {
                int retryAfterSeconds = retryAfter(page.retryAfterSeconds(), properties.getFinalityRetryDelay());
                checkpoint.defer("STALE", watermark, now.plusSeconds(retryAfterSeconds));
                accountCheckpointRepository.save(checkpoint);
                runRepository.save(McnIncomeSyncRun.stale(runId, platform, requestedCursor, page.requestId(),
                        watermark, retryAfterSeconds, now));
                return new McnIncomePullResult(platform, "STALE", null, 0, 0, 0, 0, false, retryAfterSeconds);
            }
            if (!page.isReady()) {
                throw new IllegalStateException("MCN income facts response status is unsupported");
            }
            if (!isFinal(page.sourceWatermark())) {
                int retryAfterSeconds = retryAfter(page.retryAfterSeconds(), properties.getFinalityRetryDelay());
                checkpoint.defer("WAITING_FINALITY", watermark, now.plusSeconds(retryAfterSeconds));
                accountCheckpointRepository.save(checkpoint);
                runRepository.save(McnIncomeSyncRun.waitingFinality(runId, platform, requestedCursor, page.requestId(),
                        watermark, retryAfterSeconds, now));
                return new McnIncomePullResult(platform, "WAITING_FINALITY", null, 0, 0, 0, 0, false, retryAfterSeconds);
            }
            validatePageScope(page, platformUserId);
            McnIncomeDeliveryResponse receipt = rawLedgerService.accept(new McnIncomeDeliveryRequest(
                    page.deliveryId(), "MCN", platform, page.snapshotAt(), page.sourceWatermark(), page.facts()));
            checkpoint.recordHistoryStart(historyStart(page.sourceWatermark()), null);
            if (windowRead) checkpoint.acceptRecoveryPage(page.nextCursor(), page.hasMore(), page.snapshotAt(), watermark, now);
            else {
                checkpoint.advance(page.nextCursor(), page.snapshotAt(), watermark, now);
                if ("STREAM_RESTART".equals(checkpoint.getRecoveryStage()) && !page.hasMore()) checkpoint.finishStreamRestart();
            }
            accountCheckpointRepository.save(checkpoint);
            updatePlatformCheckpoint(platform, page, watermark, now);
            runRepository.save(McnIncomeSyncRun.success(runId, platform, requestedCursor, page.deliveryId(),
                    page.requestId(), receipt.receivedFactCount(), receipt.newFactCount(), receipt.duplicateFactCount(),
                    receipt.unmatchedFactCount(), page.snapshotAt(), watermark, now));
            if (!page.facts().isEmpty()) {
                Set<LocalDate> businessDates = page.facts().stream().map(fact -> fact.businessDate())
                        .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
                events.publishEvent(new McnIncomeFactsAcceptedEvent(platform, businessDates));
            }
            return new McnIncomePullResult(platform, "SUCCESS", page.deliveryId(), receipt.receivedFactCount(),
                    receipt.newFactCount(), receipt.duplicateFactCount(), receipt.unmatchedFactCount(),
                    windowRead || page.hasMore(), null);
        } catch (McnIncomeFactsTransportException exception) {
            if (exception.getStatusCode() == 410) {
                if ("WINDOW_READ".equals(checkpoint.getRecoveryStage())) {
                    checkpoint.replayRecoveryWindow();
                    checkpoint.defer("RECOVERING", checkpoint.getLastSourceWatermark(), now.plusSeconds(60));
                    accountCheckpointRepository.save(checkpoint);
                    return new McnIncomePullResult(platform, "DEFERRED", null, 0, 0, 0, 0, false, 60);
                } else if (checkpoint.getHistoryStart() != null) {
                    checkpoint.beginRecovery(checkpoint.getHistoryStart(), LocalDate.now(clock.withZone(ZoneId.of("Asia/Shanghai"))));
                } else {
                    checkpoint.blockRecovery("MCN historyStart has not been recorded; recovery cannot safely choose a date range");
                }
                accountCheckpointRepository.save(checkpoint);
                return new McnIncomePullResult(platform, "BLOCKED".equals(checkpoint.getRecoveryStage()) ? "FAILED" : "SUCCESS",
                        null, 0, 0, 0, 0, !"BLOCKED".equals(checkpoint.getRecoveryStage()), null);
            }
            Integer retryAfterSeconds = retryAfterSeconds(exception);
            String errorCode = "HTTP_" + exception.getStatusCode();
            if (exception.getStatusCode() == 429) {
                checkpoint.fail(errorCode, exception.getMessage(), now.plusSeconds(retryAfterSeconds));
                runRepository.save(McnIncomeSyncRun.throttled(runId, platform, requestedCursor,
                        errorCode, exception.getMessage(), retryAfterSeconds, now));
            } else {
                checkpoint.fail(errorCode, exception.getMessage(), null);
                runRepository.save(McnIncomeSyncRun.failed(runId, platform, requestedCursor,
                        errorCode, exception.getMessage(), retryAfterSeconds, now));
            }
            accountCheckpointRepository.save(checkpoint);
            return new McnIncomePullResult(platform, exception.getStatusCode() == 429 ? "THROTTLED" : "FAILED",
                    null, 0, 0, 0, 0, false, retryAfterSeconds);
        } catch (RuntimeException exception) {
            checkpoint.fail("PROCESSING_ERROR", exception.getMessage(), null);
            accountCheckpointRepository.save(checkpoint);
            runRepository.save(McnIncomeSyncRun.failed(runId, platform, requestedCursor,
                    "PROCESSING_ERROR", exception.getMessage(), null, now));
            return new McnIncomePullResult(platform, "FAILED", null, 0, 0, 0, 0, false, null);
        }
    }

    /**
     * Drains a bounded number of pages per scheduler run. The durable cursor advances only after
     * each accepted page, so a process restart or a later page failure resumes safely.
     */
    public synchronized McnIncomePullBatchResult pullAvailablePages(String requestedPlatform) {
        String platform = normalizePlatform(requestedPlatform);
        int safeMaxPages = Math.max(1, Math.min(properties.getMaxPagesPerRun(), 100));
        int pages = 0, received = 0, added = 0, duplicates = 0, unmatched = 0;
        boolean hasMore = false;
        boolean deferred = false;
        String incompleteStatus = null;
        Integer incompleteRetryAfter = null;
        List<PlatformAccountBinding> accounts = verifiedAccounts(platform).stream()
                .sorted(Comparator.comparing(binding -> accountCheckpointRepository
                        .findById(McnIncomeAccountSyncCheckpoint.key(platform, binding.getPlatformUserId()))
                        .map(McnIncomeAccountSyncCheckpoint::getLastSuccessAt).orElse(null),
                        Comparator.nullsFirst(Comparator.naturalOrder())))
                .toList();
        for (PlatformAccountBinding account : accounts) {
            do {
                if (pages >= safeMaxPages) return new McnIncomePullBatchResult(platform, "PARTIAL", pages,
                        received, added, duplicates, unmatched, true, null);
                McnIncomePullResult page = pullNextPage(platform, account.getPlatformUserId());
                if ("DEFERRED".equals(page.status())) { deferred = true; break; }
                pages++; received += page.receivedCount(); added += page.newCount(); duplicates += page.duplicateCount(); unmatched += page.unmatchedCount();
                if ("STALE".equals(page.status()) || "WAITING_FINALITY".equals(page.status())) {
                    incompleteStatus = page.status();
                    incompleteRetryAfter = page.retryAfterSeconds();
                    break;
                }
                if (!"SUCCESS".equals(page.status())) {
                    return new McnIncomePullBatchResult(platform, page.status(), pages, received, added, duplicates, unmatched, false, page.retryAfterSeconds());
                }
                hasMore = page.hasMore();
            } while (hasMore);
        }
        if (accounts.isEmpty()) {
            return new McnIncomePullBatchResult(platform, "EMPTY_SCOPE", 0, 0, 0, 0, 0, false, null);
        }
        return new McnIncomePullBatchResult(platform, incompleteStatus != null ? incompleteStatus : deferred ? "PARTIAL" : "SUCCESS", pages, received,
                added, duplicates, unmatched, deferred, incompleteRetryAfter);
    }

    private McnIncomePullResult reconcileRecoveryWindow(String platform, String platformUserId,
                                                         McnIncomeAccountSyncCheckpoint checkpoint, Instant now) {
        McnIncomeFactsReconciliationPage page = client.reconcile(new McnIncomeFactsReconciliationQuery(platform,
                List.of(platformUserId), checkpoint.getRecoveryFrom(), checkpoint.getRecoveryWindowEnd(), List.of())).page();
        if (!page.isReady() || !isFinal(page.sourceWatermark())) {
            int retry = retryAfter(page.retryAfterSeconds(), properties.getFinalityRetryDelay());
            checkpoint.defer("WAITING_FINALITY", json(page.sourceWatermark()), now.plusSeconds(retry));
            accountCheckpointRepository.save(checkpoint);
            return new McnIncomePullResult(platform, "WAITING_FINALITY", null, 0, 0, 0, 0, false, retry);
        }
        if (!List.of(platformUserId).equals(page.scopedPlatformUserIds())
                || !checkpoint.getRecoveryFrom().equals(page.businessDateFrom())
                || !checkpoint.getRecoveryWindowEnd().equals(page.businessDateTo())) {
            throw new IllegalStateException("MCN recovery reconciliation scope or date range changed");
        }
        var comparison = McnIncomeControlledReadOnlyService.compare(page, platform, List.of(),
                List.of(platformUserId), eventRepository);
        if (!"MATCHED".equals(comparison.status())) {
            checkpoint.replayRecoveryWindow();
            checkpoint.defer("RECOVERING", json(page.sourceWatermark()), now.plusSeconds(60));
            accountCheckpointRepository.save(checkpoint);
            return new McnIncomePullResult(platform, "DEFERRED", null, 0, 0, 0, 0, false, 60);
        }
        checkpoint.finishRecoveryWindow();
        accountCheckpointRepository.save(checkpoint);
        return new McnIncomePullResult(platform, "SUCCESS", null, 0, 0, 0, 0, true, null);
    }

    private List<PlatformAccountBinding> verifiedAccounts(String platform) {
        return bindingRepository.findByBindingStatusAndPlatformCode(PlatformBindingStatus.VERIFIED, platform).stream()
                .filter(binding -> binding.getPlatformUserId() != null && !binding.getPlatformUserId().isBlank())
                .collect(java.util.stream.Collectors.toMap(PlatformAccountBinding::getPlatformUserId, value -> value, (left, right) -> left))
                .values().stream().sorted(Comparator.comparing(PlatformAccountBinding::getPlatformUserId)).toList();
    }

    private void validatePageScope(McnIncomeFactsPage page, String platformUserId) {
        if (page.scopedPlatformUserIds() == null || !page.scopedPlatformUserIds().equals(List.of(platformUserId))) {
            throw new IllegalStateException("MCN returned a different income account scope than requested");
        }
        if (page.facts().stream().anyMatch(fact -> !platformUserId.equals(fact.platformUserId()))) {
            throw new IllegalStateException("MCN returned an income fact outside the verified account scope");
        }
    }

    private void updatePlatformCheckpoint(String platform, McnIncomeFactsPage page, String watermark, Instant now) {
        McnIncomeSyncCheckpoint checkpoint = checkpointRepository.findById(platform)
                .orElseGet(() -> McnIncomeSyncCheckpoint.initial(platform));
        checkpoint.recordAccountScopedSuccess(page.snapshotAt(), watermark, now);
        checkpointRepository.save(checkpoint);
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

    /** MCN's authenticated 429 response currently has no Retry-After header; its V1 contract requires 60 seconds. */
    private Integer retryAfterSeconds(McnIncomeFactsTransportException exception) {
        if (exception.getRetryAfterSeconds() != null && exception.getRetryAfterSeconds() > 0) return exception.getRetryAfterSeconds();
        return exception.getStatusCode() == 429 ? 60 : null;
    }

    private boolean isFinal(com.fasterxml.jackson.databind.JsonNode watermark) {
        return watermark != null && "FINAL".equalsIgnoreCase(watermark.path("completeness").asText());
    }

    private LocalDate historyStart(com.fasterxml.jackson.databind.JsonNode watermark) {
        String value = watermark == null ? null : watermark.path("historyStart").asText(null);
        if (value == null || value.isBlank()) throw new IllegalStateException("MCN income historyStart is missing");
        return LocalDate.parse(value);
    }

    private int retryAfter(Integer supplied, Duration fallback) {
        if (supplied != null && supplied > 0) return supplied;
        long seconds = fallback == null ? 60 : fallback.toSeconds();
        return (int) Math.max(1, Math.min(seconds, 86_400));
    }

    private int secondsUntil(Instant nextAttemptAt, Instant now) {
        if (nextAttemptAt == null) return 0;
        return (int) Math.max(1, Math.min(Duration.between(now, nextAttemptAt).toSeconds(), 86_400));
    }
}
