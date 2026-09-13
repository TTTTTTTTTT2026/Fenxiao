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
import com.fenxiao.income.mcn.repository.McnIncomeControlledReadRunRepository;
import com.fenxiao.income.mcn.repository.McnIncomeRawLedgerEventRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
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
    private final McnIncomeControlledReadRunRepository runRepository;
    private final ObjectMapper json;
    private final Clock clock;

    public McnIncomeControlledReadOnlyService(McnIncomeFactsClient client, McnIncomeFactsProperties properties,
                                              McnIncomeRawLedgerService rawLedgerService,
                                              McnIncomeRawLedgerEventRepository eventRepository,
                                              McnIncomeControlledReadRunRepository runRepository,
                                              ObjectMapper json, Clock clock) {
        this.client = client; this.properties = properties; this.rawLedgerService = rawLedgerService;
        this.eventRepository = eventRepository; this.runRepository = runRepository; this.json = json; this.clock = clock;
    }

    public McnIncomeControlledChangesResponse readChanges(McnIncomeControlledChangesRequest request) {
        requireControlledMode();
        String platform = platform(request.platformCode());
        validateDateRange(request.businessDateFrom(), request.businessDateTo());
        int pageSize = request.pageSize() == null ? properties.getPageSize() : request.pageSize();
        String requestId = request.requestId() == null || request.requestId().isBlank()
                ? UUID.randomUUID().toString() : request.requestId().trim();
        McnIncomeFactsQuery query = new McnIncomeFactsQuery(platform, blankToNull(request.cursor()), pageSize,
                request.businessDateFrom(), request.businessDateTo());
        McnIncomeFactsQueryResult result = client.query(query, new McnIncomeFactsRequestContext(requestId));
        McnIncomeFactsPage page = result.page();
        int facts = 0, added = 0, duplicates = 0, unmatched = 0;
        if (page.isReady()) {
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
        List<String> guildIds = request.guildIds() == null ? List.of() : request.guildIds().stream().map(this::requiredText).toList();
        McnIncomeFactsReconciliationResult result = client.reconcile(new McnIncomeFactsReconciliationQuery(platform,
                request.businessDateFrom(), request.businessDateTo(), guildIds));
        McnIncomeFactsReconciliationPage page = result.page();
        Comparison comparison = page.isReady() ? compare(page, platform, guildIds) : new Comparison("STALE", 0, 0, 0);
        String runId = UUID.randomUUID().toString();
        runRepository.save(McnIncomeControlledReadRun.reconciliation(runId, platform, result.audit().requestId(),
                result.audit().bodySha256(), page.sourceStatus(), result.audit().httpStatus(), result.audit().latencyMillis(), comparison.status(),
                page.retryAfterSeconds(), json(page.sourceWatermark()), clock.instant()));
        return new McnIncomeControlledReconciliationResponse(runId, result.audit().requestId(), page.sourceStatus(), comparison.status(),
                comparison.mcnGroupCount(), comparison.banDeiraGroupCount(), comparison.mismatchGroupCount(), page.retryAfterSeconds());
    }

    private Comparison compare(McnIncomeFactsReconciliationPage page, String platform, List<String> guildIds) {
        Map<String, Aggregate> expected = page.groups().stream().collect(Collectors.toMap(
                this::key, group -> new Aggregate(group.factCount(), group.absoluteAmountTotal()), (left, right) -> right));
        Map<String, McnIncomeRawLedgerEvent> newest = new HashMap<>();
        for (McnIncomeRawLedgerEvent event : eventRepository.findBySourceSystemAndPlatformCodeAndBusinessDateBetween(
                "MCN", platform, page.businessDateFrom(), page.businessDateTo())) {
            if (!guildIds.isEmpty() && !guildIds.contains(event.getGuildId())) continue;
            newest.merge(event.getSourceEventId(), event, this::newer);
        }
        Map<String, Aggregate> actual = new HashMap<>();
        for (McnIncomeRawLedgerEvent event : newest.values()) {
            String key = key(event.getBusinessDate(), event.getGuildId(), event.getSettlementStatus().name(),
                    event.getAmountUnit(), event.getCurrencyCode());
            actual.merge(key, new Aggregate(1, event.getAmount()), Aggregate::add);
        }
        int mismatches = 0;
        for (String key : union(expected, actual)) {
            Aggregate expectedValue = expected.get(key), actualValue = actual.get(key);
            if (expectedValue == null || actualValue == null || expectedValue.factCount != actualValue.factCount
                    || expectedValue.amount.compareTo(actualValue.amount) != 0) mismatches++;
        }
        return new Comparison(mismatches == 0 ? "MATCHED" : "MISMATCH", expected.size(), actual.size(), mismatches);
    }

    private McnIncomeRawLedgerEvent newer(McnIncomeRawLedgerEvent left, McnIncomeRawLedgerEvent right) {
        Comparator<McnIncomeRawLedgerEvent> comparator = Comparator.comparing(McnIncomeRawLedgerEvent::getSourceUpdatedAt)
                .thenComparing(McnIncomeRawLedgerEvent::getSourceRevision);
        return comparator.compare(left, right) >= 0 ? left : right;
    }

    private List<String> union(Map<String, Aggregate> left, Map<String, Aggregate> right) {
        return java.util.stream.Stream.concat(left.keySet().stream(), right.keySet().stream()).distinct().toList();
    }

    private String key(McnIncomeFactsReconciliationGroup group) { return key(group.businessDate(), group.guildId(), group.settlementStatus(), group.amountUnit(), group.currencyCode()); }
    private String key(LocalDate date, String guildId, String settlementStatus, String amountUnit, String currencyCode) { return date + "|" + guildId + "|" + settlementStatus + "|" + amountUnit + "|" + currencyCode; }
    private void requireControlledMode() { if (!properties.isControlledReadOnlyConfigured() || !client.enabled()) throw new IllegalStateException("MCN controlled read-only mode is disabled or not configured"); }
    private String platform(String value) { String platform = requiredText(value).toUpperCase(Locale.ROOT); if (!"TIMO".equals(platform) && !"LINKY".equals(platform)) throw new IllegalArgumentException("income platform must be TIMO or LINKY"); return platform; }
    private void validateDateRange(LocalDate from, LocalDate to) { if (from == null || to == null || to.isBefore(from) || from.plusDays(30).isBefore(to)) throw new IllegalArgumentException("controlled income read must cover 1 to 31 inclusive business days"); }
    private String requiredText(String value) { if (value == null || value.isBlank()) throw new IllegalArgumentException("value is required"); return value.trim(); }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private String json(Object value) { try { return json.writeValueAsString(value); } catch (JsonProcessingException exception) { throw new IllegalStateException("MCN controlled read audit serialization failed", exception); } }
    private String sha256(String value) { try { return java.util.HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); } catch (Exception exception) { throw new IllegalStateException("MCN controlled read hash failed", exception); } }
    private String shortHash(String value) { return sha256(value).substring(0, 12); }

    private record Aggregate(int factCount, BigDecimal amount) { Aggregate add(Aggregate other) { return new Aggregate(factCount + other.factCount, amount.add(other.amount)); } }
    private record Comparison(String status, int mcnGroupCount, int banDeiraGroupCount, int mismatchGroupCount) { }
}
