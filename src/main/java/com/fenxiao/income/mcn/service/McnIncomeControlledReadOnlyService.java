package com.fenxiao.income.mcn.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fenxiao.income.mcn.api.dto.McnIncomeControlledChangesRequest;
import com.fenxiao.income.mcn.api.dto.McnIncomeControlledChangesResponse;
import com.fenxiao.income.mcn.api.dto.McnIncomeControlledReconciliationRequest;
import com.fenxiao.income.mcn.api.dto.McnIncomeControlledReconciliationResponse;
import com.fenxiao.income.mcn.dto.McnIncomeDeliveryRequest;
import com.fenxiao.income.mcn.dto.McnIncomeDeliveryResponse;
import com.fenxiao.income.mcn.entity.McnIncomeControlledReadRun;
import com.fenxiao.income.mcn.entity.McnIncomeRawLedgerEvent;
import com.fenxiao.income.mcn.external.McnIncomeFactsClient;
import com.fenxiao.income.mcn.external.McnIncomeFactsPage;
import com.fenxiao.income.mcn.external.McnIncomeFactsProperties;
import com.fenxiao.income.mcn.external.McnIncomeFactsQuery;
import com.fenxiao.income.mcn.external.McnIncomeFactsQueryResult;
import com.fenxiao.income.mcn.external.McnIncomeFactsReconciliationGroup;
import com.fenxiao.income.mcn.external.McnIncomeFactsReconciliationPage;
import com.fenxiao.income.mcn.external.McnIncomeFactsReconciliationQuery;
import com.fenxiao.income.mcn.external.McnIncomeFactsReconciliationResult;
import com.fenxiao.income.mcn.external.McnIncomeFactsRequestContext;
import com.fenxiao.income.mcn.external.McnIncomeFactsTransportException;
import com.fenxiao.income.mcn.repository.McnIncomeControlledReadRunRepository;
import com.fenxiao.income.mcn.repository.McnIncomeRawLedgerEventRepository;
import com.fenxiao.platform.domain.PlatformBindingStatus;
import com.fenxiao.platform.entity.PlatformAccountBinding;
import com.fenxiao.platform.repository.PlatformAccountBindingRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Deliberately separate from the scheduled puller. This service can write source evidence to the
 * raw ledger, but never invokes rewards, wallets, withdrawals, or payment services.
 */
@Service
@Transactional
public class McnIncomeControlledReadOnlyService {
    private final McnIncomeFactsClient client;
    private final McnIncomeFactsProperties properties;
    private final McnIncomeRawLedgerService rawLedgerService;
    private final McnIncomeRawLedgerEventRepository eventRepository;
    private final PlatformAccountBindingRepository bindingRepository;
    private final McnIncomeControlledReadRunRepository runRepository;
    private final ObjectMapper json;
    private final Clock clock;

    public McnIncomeControlledReadOnlyService(McnIncomeFactsClient client, McnIncomeFactsProperties properties,
                                              McnIncomeRawLedgerService rawLedgerService,
                                              McnIncomeRawLedgerEventRepository eventRepository,
                                              PlatformAccountBindingRepository bindingRepository,
                                              McnIncomeControlledReadRunRepository runRepository,
                                              ObjectMapper json, Clock clock) {
        this.client = client; this.properties = properties; this.rawLedgerService = rawLedgerService;
        this.eventRepository = eventRepository; this.bindingRepository = bindingRepository;
        this.runRepository = runRepository; this.json = json; this.clock = clock;
    }

    public McnIncomeControlledChangesResponse readChanges(McnIncomeControlledChangesRequest request) {
        requireControlledMode();
        String platform = platform(request.platformCode());
        validateDateRange(request.businessDateFrom(), request.businessDateTo());
        List<String> accountIds = registeredPlatformUserIds(platform);
        int pageSize = request.pageSize() == null ? properties.getPageSize() : request.pageSize();
        String requestId = request.requestId() == null || request.requestId().isBlank()
                ? UUID.randomUUID().toString() : request.requestId().trim();
        McnIncomeFactsQuery query = new McnIncomeFactsQuery(platform, accountIds, blankToNull(request.cursor()), pageSize,
                request.businessDateFrom(), request.businessDateTo());
        long startedNanos = System.nanoTime();
        McnIncomeFactsQueryResult result;
        try {
            result = client.query(query, new McnIncomeFactsRequestContext(requestId));
        } catch (McnIncomeFactsTransportException exception) {
            Integer retryAfterSeconds = retryAfterSeconds(exception);
            long latencyMillis = Math.max(0, (System.nanoTime() - startedNanos) / 1_000_000L);
            String runId = UUID.randomUUID().toString();
            runRepository.save(McnIncomeControlledReadRun.changes(runId, platform, requestId,
                    sha256(platform + "|" + blankToNull(request.cursor()) + "|" + pageSize + "|" + request.businessDateFrom() + "|" + request.businessDateTo()),
                    blankToNull(request.cursor()), null, null, "HTTP_" + exception.getStatusCode(), exception.getStatusCode(),
                    latencyMillis, 0, 0, 0, 0, retryAfterSeconds, "{}", clock.instant()));
            return new McnIncomeControlledChangesResponse(runId, requestId, exception.getStatusCode(), latencyMillis,
                    "HTTP_" + exception.getStatusCode(), null, 0, 0, 0, 0, false, null, null, false, retryAfterSeconds);
        }
        McnIncomeFactsPage page = result.page();
        int facts = 0, added = 0, duplicates = 0, unmatched = 0;
        if (page.isReady() && isFinal(page.sourceWatermark())) {
            McnIncomeDeliveryResponse receipt = rawLedgerService.accept(new McnIncomeDeliveryRequest(page.deliveryId(), "MCN",
                    platform, page.snapshotAt(), page.sourceWatermark(), page.facts()));
            facts = receipt.receivedFactCount(); added = receipt.newFactCount();
            duplicates = receipt.duplicateFactCount(); unmatched = receipt.unmatchedFactCount();
        }
        String runId = UUID.randomUUID().toString();
        String nextCursor = page.nextCursor();
        runRepository.save(McnIncomeControlledReadRun.changes(runId, platform, result.audit().requestId(),
                result.audit().bodySha256(), blankToNull(request.cursor()), nextCursor,
                page.deliveryId() == null ? null : sha256(page.deliveryId()), page.sourceStatus(), result.audit().httpStatus(),
                result.audit().latencyMillis(), facts, added, duplicates, unmatched, page.retryAfterSeconds(),
                json(page.sourceWatermark()), clock.instant()));
        return new McnIncomeControlledChangesResponse(runId, result.audit().requestId(), result.audit().httpStatus(),
                result.audit().latencyMillis(), page.sourceStatus(), page.deliveryId() == null ? null : shortHash(page.deliveryId()),
                facts, added, duplicates, unmatched, page.hasMore(), nextCursor,
                nextCursor == null ? null : shortHash(nextCursor), nextCursor != null, page.retryAfterSeconds());
    }

    public McnIncomeControlledReconciliationResponse reconcile(McnIncomeControlledReconciliationRequest request) {
        requireControlledMode();
        String platform = platform(request.platformCode());
        validateDateRange(request.businessDateFrom(), request.businessDateTo());
        List<String> accountIds = registeredPlatformUserIds(platform);
        List<String> guildIds = request.guildIds() == null ? List.of() : request.guildIds().stream().map(this::requiredText).toList();
        McnIncomeFactsReconciliationResult result = client.reconcile(new McnIncomeFactsReconciliationQuery(platform,
                accountIds, request.businessDateFrom(), request.businessDateTo(), guildIds));
        McnIncomeFactsReconciliationPage page = result.page();
        if (!accountIds.equals(page.scopedPlatformUserIds())) throw new IllegalStateException("MCN reconciliation scope does not match verified accounts");
        Comparison comparison = page.isReady() && isFinal(page.sourceWatermark())
                ? compare(page, platform, guildIds, accountIds, eventRepository)
                : new Comparison("WAITING_FINALITY", 0, 0, 0);
        String runId = UUID.randomUUID().toString();
        runRepository.save(McnIncomeControlledReadRun.reconciliation(runId, platform, result.audit().requestId(),
                result.audit().bodySha256(), page.sourceStatus(), result.audit().httpStatus(), result.audit().latencyMillis(), comparison.status(),
                page.retryAfterSeconds(), json(page.sourceWatermark()), clock.instant()));
        return new McnIncomeControlledReconciliationResponse(runId, result.audit().requestId(), page.sourceStatus(), comparison.status(),
                comparison.mcnGroupCount(), comparison.banDeiraGroupCount(), comparison.mismatchGroupCount(), page.retryAfterSeconds());
    }

    static Comparison compare(McnIncomeFactsReconciliationPage page, String platform, List<String> guildIds,
                              List<String> accountIds, McnIncomeRawLedgerEventRepository eventRepository) {
        Map<String, McnIncomeFactsReconciliationGroup> expected = page.groups().stream().collect(Collectors.toMap(
                McnIncomeControlledReadOnlyService::key, group -> group));
        Map<String, List<McnIncomeRawLedgerEvent>> grouped = new HashMap<>();
        for (McnIncomeRawLedgerEvent event : eventRepository.findLatestBySourceSystemAndPlatformCodeAndBusinessDateBetween(
                "MCN", platform, page.businessDateFrom(), page.businessDateTo())) {
            if (!accountIds.contains(event.getPlatformUserId())) continue;
            if (!guildIds.isEmpty() && !guildIds.contains(event.getGuildId())) continue;
            String key = key(event.getBusinessDate(), event.getGuildId(), event.getSettlementStatus().name(),
                    event.getAmountUnit(), event.getCurrencyCode());
            grouped.computeIfAbsent(key, ignored -> new java.util.ArrayList<>()).add(event);
        }
        Map<String, Aggregate> actual = new HashMap<>();
        grouped.forEach((key, events) -> actual.put(key, new Aggregate(events.size(),
                events.stream().map(event -> event.getAmount().abs()).reduce(BigDecimal.ZERO, BigDecimal::add),
                McnIncomeReconciliationChecksum.ofEvents(events))));
        int mismatches = 0;
        for (String key : union(expected, actual)) {
            McnIncomeFactsReconciliationGroup expectedValue = expected.get(key);
            Aggregate actualValue = actual.get(key);
            if (expectedValue == null || actualValue == null || expectedValue.factCount() != actualValue.factCount()
                    || expectedValue.absoluteAmountTotal().compareTo(actualValue.amount()) != 0
                    || !expectedValue.projectionChecksum().equals(actualValue.checksum())) mismatches++;
        }
        return new Comparison(mismatches == 0 ? "MATCHED" : "MISMATCH",
                expected.size(), actual.size(), mismatches);
    }


    private static List<String> union(Map<String, ?> left, Map<String, ?> right) {
        return java.util.stream.Stream.concat(left.keySet().stream(), right.keySet().stream()).distinct().toList();
    }

    private static String key(McnIncomeFactsReconciliationGroup group) { return key(group.businessDate(), group.guildId(), group.settlementStatus(), group.amountUnit(), group.currencyCode()); }
    private static String key(LocalDate date, String guildId, String settlementStatus, String amountUnit, String currencyCode) { return date + "|" + guildId + "|" + settlementStatus + "|" + amountUnit + "|" + currencyCode; }
    private void requireControlledMode() {
        if (!properties.isRegisteredUserScopedControlledReadOnlyConfigured() || !client.enabled()) {
            throw new IllegalStateException("MCN account-scoped V2 read is disabled or not configured");
        }
    }
    private List<String> registeredPlatformUserIds(String platform) {
        List<String> ids = bindingRepository.findByBindingStatusAndPlatformCode(PlatformBindingStatus.VERIFIED, platform).stream()
                .map(PlatformAccountBinding::getPlatformUserId).filter(value -> value != null && !value.isBlank())
                .distinct().sorted().toList();
        if (ids.size() > 100) throw new IllegalStateException("受控读取最多支持 100 个已核验账号，请缩小本次范围后重试。");
        return ids;
    }
    private String platform(String value) { String platform = requiredText(value).toUpperCase(Locale.ROOT); if (!"TIMO".equals(platform) && !"LINKY".equals(platform)) throw new IllegalArgumentException("income platform must be TIMO or LINKY"); return platform; }
    private void validateDateRange(LocalDate from, LocalDate to) { if (from == null || to == null || to.isBefore(from) || from.plusDays(30).isBefore(to)) throw new IllegalArgumentException("controlled income read must cover 1 to 31 inclusive business days"); }
    private String requiredText(String value) { if (value == null || value.isBlank()) throw new IllegalArgumentException("value is required"); return value.trim(); }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private String json(Object value) { try { return json.writeValueAsString(value); } catch (JsonProcessingException exception) { throw new IllegalStateException("MCN controlled read audit serialization failed", exception); } }
    private String sha256(String value) { try { return java.util.HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); } catch (Exception exception) { throw new IllegalStateException("MCN controlled read hash failed", exception); } }
    private String shortHash(String value) { return sha256(value).substring(0, 12); }
    private boolean isFinal(com.fasterxml.jackson.databind.JsonNode watermark) {
        return watermark != null && "FINAL".equalsIgnoreCase(watermark.path("completeness").asText());
    }
    private Integer retryAfterSeconds(McnIncomeFactsTransportException exception) {
        if (exception.getRetryAfterSeconds() != null && exception.getRetryAfterSeconds() > 0) return exception.getRetryAfterSeconds();
        return exception.getStatusCode() == 429 ? 60 : null;
    }

    private record Aggregate(int factCount, BigDecimal amount, String checksum) { }
    record Comparison(String status, int mcnGroupCount, int banDeiraGroupCount, int mismatchGroupCount) { }
}
