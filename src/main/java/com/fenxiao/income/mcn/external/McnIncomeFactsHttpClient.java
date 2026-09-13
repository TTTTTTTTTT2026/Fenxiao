package com.fenxiao.income.mcn.external;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fenxiao.income.mcn.domain.McnIncomeEventType;
import com.fenxiao.income.mcn.domain.McnIncomeSettlementStatus;
import com.fenxiao.income.mcn.dto.McnIncomeFactRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;

/** Dedicated client for the MCN Income Facts V1 changes and reconciliation contracts. */
@Component
@EnableConfigurationProperties(McnIncomeFactsProperties.class)
public class McnIncomeFactsHttpClient implements McnIncomeFactsClient {
    static final String CHANGES_PATH = "/api/external/income-facts/v1/changes/query";
    static final String CHANGES_SCOPE = "income_facts.read";
    static final String RECONCILIATION_PATH = "/api/external/income-facts/v1/reconciliation/query";
    static final String RECONCILIATION_SCOPE = "income_facts.reconciliation.read";

    private final McnIncomeFactsProperties properties;
    private final ObjectMapper json;
    private final Clock clock;
    private final HttpClient http;
    private final McnIncomeFactsRequestSigner signer = new McnIncomeFactsRequestSigner();
    private final SecureRandom random = new SecureRandom();

    @Autowired
    public McnIncomeFactsHttpClient(McnIncomeFactsProperties properties, ObjectMapper json, Clock clock) {
        this(properties, json, clock, HttpClient.newBuilder().connectTimeout(properties.getConnectTimeout()).build());
    }

    McnIncomeFactsHttpClient(McnIncomeFactsProperties properties, ObjectMapper json, Clock clock, HttpClient http) {
        this.properties = properties;
        this.json = json;
        this.clock = clock;
        this.http = http;
    }

    @Override
    public boolean enabled() {
        return properties.isCredentialConfigured();
    }

    @Override
    public McnIncomeFactsPage query(McnIncomeFactsQuery query) {
        return query(query, McnIncomeFactsRequestContext.newRequest()).page();
    }

    @Override
    public McnIncomeFactsQueryResult query(McnIncomeFactsQuery query, McnIncomeFactsRequestContext context) {
        requireConfigured();
        String platform = normalizePlatform(query.platformCode());
        try {
            ObjectNode body = json.createObjectNode();
            body.put("platformCode", platform);
            if (query.cursor() == null || query.cursor().isBlank()) body.putNull("cursor"); else body.put("cursor", query.cursor());
            body.put("pageSize", Math.min(500, Math.max(1, query.pageSize())));
            if (query.businessDateFrom() != null) body.put("businessDateFrom", query.businessDateFrom().toString());
            if (query.businessDateTo() != null) body.put("businessDateTo", query.businessDateTo().toString());
            McnResponse response = post(CHANGES_PATH, CHANGES_SCOPE, json.writeValueAsString(body), context);
            return new McnIncomeFactsQueryResult(parseChanges(response.body(), platform, context.requestId()), response.audit());
        } catch (McnIncomeFactsTransportException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new McnIncomeFactsTransportException("MCN income facts transport failure", 0, null, exception);
        }
    }

    @Override
    public McnIncomeFactsReconciliationResult reconcile(McnIncomeFactsReconciliationQuery query) {
        requireConfigured();
        String platform = normalizePlatform(query.platformCode());
        validateDateRange(query.businessDateFrom(), query.businessDateTo());
        List<String> guildIds = query.guildIds() == null ? List.of() : query.guildIds();
        if (guildIds.size() > 100) throw new IllegalArgumentException("MCN reconciliation accepts at most 100 guild ids");
        try {
            ObjectNode body = json.createObjectNode();
            body.put("platformCode", platform);
            body.put("businessDateFrom", query.businessDateFrom().toString());
            body.put("businessDateTo", query.businessDateTo().toString());
            if (!guildIds.isEmpty()) {
                ArrayNode values = body.putArray("guildIds");
                for (String guildId : guildIds) values.add(requireText(guildId, "guild id"));
            }
            McnIncomeFactsRequestContext context = McnIncomeFactsRequestContext.newRequest();
            McnResponse response = post(RECONCILIATION_PATH, RECONCILIATION_SCOPE, json.writeValueAsString(body), context);
            return new McnIncomeFactsReconciliationResult(
                    parseReconciliation(response.body(), platform, context.requestId()), response.audit());
        } catch (McnIncomeFactsTransportException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new McnIncomeFactsTransportException("MCN income reconciliation transport failure", 0, null, exception);
        }
    }

    private McnResponse post(String path, String scope, String rawBody, McnIncomeFactsRequestContext context) throws Exception {
        String nonce = nonce();
        Instant requestedAt = clock.instant();
        long startedNanos = System.nanoTime();
        HttpRequest request = HttpRequest.newBuilder(URI.create(baseUrl() + path))
                .timeout(properties.getRequestTimeout())
                .header("Content-Type", "application/json")
                .header("X-MCN-Credential-Id", properties.getCredentialId())
                .header("X-MCN-Scope", scope)
                .header("X-MCN-Timestamp", Long.toString(requestedAt.getEpochSecond()))
                .header("X-MCN-Nonce", nonce)
                .header("X-Request-Id", context.requestId())
                .header("X-Idempotency-Key", context.requestId())
                .header("X-MCN-Signature", signer.sign(properties.getHmacSecret(), "POST", path, scope,
                        requestedAt.getEpochSecond(), nonce, context.requestId(), rawBody))
                .POST(HttpRequest.BodyPublishers.ofString(rawBody, StandardCharsets.UTF_8))
                .build();
        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
        long latencyMillis = Math.max(0, (System.nanoTime() - startedNanos) / 1_000_000L);
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new McnIncomeFactsTransportException("MCN income facts request failed: HTTP " + response.statusCode(),
                    response.statusCode(), retryAfter(response), null);
        }
        return new McnResponse(response.body(), new McnIncomeFactsRequestAudit(context.requestId(), signer.sha256(rawBody),
                requestedAt, response.statusCode(), latencyMillis));
    }

    private McnIncomeFactsPage parseChanges(String body, String platform, String fallbackRequestId) throws Exception {
        JsonNode root = validRoot(body, platform);
        String sourceStatus = sourceStatus(root);
        JsonNode watermark = watermark(root);
        List<McnIncomeFactRequest> facts = new ArrayList<>();
        for (JsonNode item : root.path("facts")) facts.add(parseFact(item));
        String deliveryId = text(root, "deliveryId");
        Instant snapshotAt = instant(root, "snapshotAt", false);
        String nextCursor = text(root, "nextCursor");
        boolean hasMore = root.path("hasMore").asBoolean(false);
        Integer retryAfter = retryAfter(root);
        if ("READY".equals(sourceStatus) && (deliveryId == null || snapshotAt == null || nextCursor == null)) {
            throw new IllegalStateException("MCN ready income page is missing delivery, snapshot or next cursor");
        }
        return new McnIncomeFactsPage(platform, deliveryId, snapshotAt, sourceStatus, watermark, List.copyOf(facts),
                nextCursor, hasMore, retryAfter, requestId(root, fallbackRequestId));
    }

    private McnIncomeFactsReconciliationPage parseReconciliation(String body, String platform, String fallbackRequestId) throws Exception {
        JsonNode root = validRoot(body, platform);
        String sourceStatus = sourceStatus(root);
        List<McnIncomeFactsReconciliationGroup> groups = new ArrayList<>();
        for (JsonNode group : root.path("groups")) {
            groups.add(new McnIncomeFactsReconciliationGroup(LocalDate.parse(required(group, "businessDate")),
                    required(group, "guildId"), required(group, "settlementStatus").toUpperCase(Locale.ROOT),
                    required(group, "amountUnit").toUpperCase(Locale.ROOT), required(group, "currencyCode").toUpperCase(Locale.ROOT),
                    group.path("factCount").asInt(), decimal(group, "absoluteAmountTotal"), required(group, "projectionChecksum")));
        }
        return new McnIncomeFactsReconciliationPage(platform, text(root, "snapshotId"), instant(root, "snapshotAt", false),
                sourceStatus, watermark(root), LocalDate.parse(required(root, "businessDateFrom")),
                LocalDate.parse(required(root, "businessDateTo")), List.copyOf(groups), retryAfter(root), requestId(root, fallbackRequestId));
    }

    private JsonNode validRoot(String body, String platform) throws Exception {
        JsonNode root = json.readTree(body);
        if (!root.path("ok").asBoolean() || !"1".equals(required(root, "apiVersion"))
                || !platform.equals(required(root, "platformCode").toUpperCase(Locale.ROOT))) {
            throw new IllegalStateException("MCN income facts response is invalid");
        }
        return root;
    }

    private String sourceStatus(JsonNode root) {
        String value = required(root, "sourceStatus").toUpperCase(Locale.ROOT);
        if (!"READY".equals(value) && !"STALE".equals(value)) throw new IllegalStateException("MCN income facts source status is invalid");
        return value;
    }

    private JsonNode watermark(JsonNode root) {
        JsonNode value = root.path("sourceWatermark");
        if (!value.isObject()) throw new IllegalStateException("MCN income facts source watermark is missing");
        return value;
    }

    private McnIncomeFactRequest parseFact(JsonNode item) {
        return new McnIncomeFactRequest(required(item, "sourceEventId"), required(item, "sourceRevision"), text(item, "originalSourceEventId"),
                required(item, "platformUserId"), required(item, "factGranularity"), enumValue(McnIncomeEventType.class, item, "eventType"),
                enumValue(McnIncomeSettlementStatus.class, item, "settlementStatus"), decimal(item, "amount"), required(item, "currencyCode"),
                required(item, "amountUnit"), LocalDate.parse(required(item, "businessDate")), required(item, "sourceTimezone"),
                instant(item, "periodStart", false), instant(item, "periodEnd", false), instant(item, "occurredAt", false),
                instant(item, "settledAt", true), instant(item, "sourceUpdatedAt", false), text(item, "guildId"),
                required(item, "settlementBasis"), requiredNode(item, "sourcePayload"));
    }

    private <T extends Enum<T>> T enumValue(Class<T> type, JsonNode node, String field) {
        try { return Enum.valueOf(type, required(node, field).toUpperCase(Locale.ROOT)); }
        catch (IllegalArgumentException exception) { throw new IllegalStateException("MCN income facts enum is invalid: " + field, exception); }
    }

    private Instant instant(JsonNode node, String field, boolean nullable) {
        String value = text(node, field);
        if (value == null && nullable) return null;
        if (value == null) throw new IllegalStateException("MCN income facts field missing: " + field);
        try { return Instant.parse(value); }
        catch (Exception exception) { throw new IllegalStateException("MCN income facts timestamp is invalid: " + field, exception); }
    }

    private BigDecimal decimal(JsonNode node, String field) {
        try { return new BigDecimal(required(node, field)); }
        catch (NumberFormatException exception) { throw new IllegalStateException("MCN income facts amount is invalid: " + field, exception); }
    }

    private Integer retryAfter(JsonNode root) { return root.hasNonNull("retryAfterSeconds") ? root.path("retryAfterSeconds").asInt() : null; }
    private String requestId(JsonNode root, String fallback) { String value = text(root, "requestId"); return value == null ? fallback : value; }
    private String required(JsonNode node, String field) { String value = text(node, field); if (value == null) throw new IllegalStateException("MCN income facts field missing: " + field); return value; }
    private JsonNode requiredNode(JsonNode node, String field) { JsonNode value = node.get(field); if (value == null || value.isNull()) throw new IllegalStateException("MCN income facts field missing: " + field); return value; }
    private String text(JsonNode node, String field) { String value = node.path(field).asText(null); return value == null || value.isBlank() ? null : value; }
    private String normalizePlatform(String value) { String platform = value == null ? "" : value.trim().toUpperCase(Locale.ROOT); if (!"TIMO".equals(platform) && !"LINKY".equals(platform)) throw new IllegalArgumentException("income platform must be TIMO or LINKY"); return platform; }
    private void validateDateRange(LocalDate from, LocalDate to) { if (from == null || to == null || to.isBefore(from) || from.plusDays(30).isBefore(to)) throw new IllegalArgumentException("income reconciliation date range must be 1 to 31 inclusive business days"); }
    private String requireText(String value, String label) { if (value == null || value.isBlank()) throw new IllegalArgumentException(label + " is required"); return value.trim(); }
    private void requireConfigured() { if (!enabled()) throw new IllegalStateException("MCN income facts credential is not configured"); }
    private String baseUrl() { return properties.getBaseUrl().replaceAll("/+$", ""); }
    private String nonce() { byte[] bytes = new byte[16]; random.nextBytes(bytes); return HexFormat.of().formatHex(bytes); }
    private Integer retryAfter(HttpResponse<?> response) { try { String value = response.headers().firstValue("Retry-After").orElse(null); return value == null ? null : Integer.parseInt(value); } catch (Exception ignored) { return null; } }

    private record McnResponse(String body, McnIncomeFactsRequestAudit audit) { }
}
