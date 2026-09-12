package com.fenxiao.income.mcn.external;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fenxiao.income.mcn.domain.McnIncomeEventType;
import com.fenxiao.income.mcn.domain.McnIncomeSettlementStatus;
import com.fenxiao.income.mcn.dto.McnIncomeFactRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/** Dedicated pull client for the MCN income-facts V1 contract. */
@Component
@EnableConfigurationProperties(McnIncomeFactsProperties.class)
public class McnIncomeFactsHttpClient implements McnIncomeFactsClient {
    static final String PATH = "/api/external/income-facts/v1/changes/query";
    static final String SCOPE = "income_facts.read";

    private final McnIncomeFactsProperties properties;
    private final ObjectMapper json;
    private final Clock clock;
    private final HttpClient http;
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
        return properties.isConfigured();
    }

    @Override
    public McnIncomeFactsPage query(McnIncomeFactsQuery query) {
        if (!enabled()) {
            throw new IllegalStateException("MCN income facts client is not configured");
        }
        String platform = normalizePlatform(query.platformCode());
        try {
            ObjectNode body = json.createObjectNode();
            body.put("platformCode", platform);
            if (query.cursor() == null || query.cursor().isBlank()) body.putNull("cursor"); else body.put("cursor", query.cursor());
            body.put("pageSize", Math.min(500, Math.max(1, query.pageSize())));
            if (query.businessDateFrom() != null) body.put("businessDateFrom", query.businessDateFrom().toString());
            if (query.businessDateTo() != null) body.put("businessDateTo", query.businessDateTo().toString());
            String rawBody = json.writeValueAsString(body);
            String requestId = UUID.randomUUID().toString();
            String nonce = nonce();
            long timestamp = clock.instant().getEpochSecond();
            String canonical = String.join("\n", "POST", PATH, SCOPE, Long.toString(timestamp), nonce, requestId, sha256(rawBody));
            HttpRequest request = HttpRequest.newBuilder(URI.create(baseUrl() + PATH))
                    .timeout(properties.getRequestTimeout())
                    .header("Content-Type", "application/json")
                    .header("X-MCN-Credential-Id", properties.getCredentialId())
                    .header("X-MCN-Scope", SCOPE)
                    .header("X-MCN-Timestamp", Long.toString(timestamp))
                    .header("X-MCN-Nonce", nonce)
                    .header("X-Request-Id", requestId)
                    .header("X-Idempotency-Key", requestId)
                    .header("X-MCN-Signature", hmac(canonical))
                    .POST(HttpRequest.BodyPublishers.ofString(rawBody, StandardCharsets.UTF_8))
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new McnIncomeFactsTransportException("MCN income facts request failed: HTTP " + response.statusCode(),
                        response.statusCode(), retryAfter(response), null);
            }
            return parse(response.body(), platform, requestId);
        } catch (McnIncomeFactsTransportException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new McnIncomeFactsTransportException("MCN income facts transport failure", 0, null, exception);
        }
    }

    private McnIncomeFactsPage parse(String body, String platform, String fallbackRequestId) throws Exception {
        JsonNode root = json.readTree(body);
        if (!root.path("ok").asBoolean() || !"1".equals(required(root, "apiVersion"))
                || !platform.equals(required(root, "platformCode").toUpperCase(Locale.ROOT))) {
            throw new IllegalStateException("MCN income facts response is invalid");
        }
        String sourceStatus = required(root, "sourceStatus").toUpperCase(Locale.ROOT);
        if (!"READY".equals(sourceStatus) && !"STALE".equals(sourceStatus)) {
            throw new IllegalStateException("MCN income facts source status is invalid");
        }
        JsonNode watermark = root.path("sourceWatermark");
        if (!watermark.isObject()) throw new IllegalStateException("MCN income facts source watermark is missing");
        List<McnIncomeFactRequest> facts = new ArrayList<>();
        for (JsonNode item : root.path("facts")) facts.add(parseFact(item));
        String deliveryId = text(root, "deliveryId");
        Instant snapshotAt = instant(root, "snapshotAt", false);
        String nextCursor = text(root, "nextCursor");
        boolean hasMore = root.path("hasMore").asBoolean(false);
        Integer retryAfter = root.hasNonNull("retryAfterSeconds") ? root.path("retryAfterSeconds").asInt() : null;
        if ("READY".equals(sourceStatus) && (deliveryId == null || snapshotAt == null || nextCursor == null)) {
            throw new IllegalStateException("MCN ready income page is missing delivery, snapshot or next cursor");
        }
        return new McnIncomeFactsPage(platform, deliveryId, snapshotAt, sourceStatus, watermark, List.copyOf(facts),
                nextCursor, hasMore, retryAfter, text(root, "requestId") == null ? fallbackRequestId : text(root, "requestId"));
    }

    private McnIncomeFactRequest parseFact(JsonNode item) {
        return new McnIncomeFactRequest(required(item, "sourceEventId"), required(item, "sourceRevision"),
                text(item, "originalSourceEventId"), required(item, "platformUserId"), required(item, "factGranularity"),
                enumValue(McnIncomeEventType.class, item, "eventType"), enumValue(McnIncomeSettlementStatus.class, item, "settlementStatus"),
                decimal(item, "amount"), required(item, "currencyCode"), required(item, "amountUnit"),
                LocalDate.parse(required(item, "businessDate")), required(item, "sourceTimezone"),
                instant(item, "periodStart", false), instant(item, "periodEnd", false), instant(item, "occurredAt", false),
                instant(item, "settledAt", true), instant(item, "sourceUpdatedAt", false), text(item, "guildId"),
                text(item, "settlementBasis"), requiredNode(item, "sourcePayload"));
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
        catch (NumberFormatException exception) { throw new IllegalStateException("MCN income facts amount is invalid", exception); }
    }

    private String required(JsonNode node, String field) { String value = text(node, field); if (value == null) throw new IllegalStateException("MCN income facts field missing: " + field); return value; }
    private JsonNode requiredNode(JsonNode node, String field) { JsonNode value = node.get(field); if (value == null || value.isNull()) throw new IllegalStateException("MCN income facts field missing: " + field); return value; }
    private String text(JsonNode node, String field) { String value = node.path(field).asText(null); return value == null || value.isBlank() ? null : value; }
    private String normalizePlatform(String value) { String platform = value == null ? "" : value.trim().toUpperCase(Locale.ROOT); if (!"TIMO".equals(platform) && !"LINKY".equals(platform)) throw new IllegalArgumentException("income platform must be TIMO or LINKY"); return platform; }
    private String baseUrl() { return properties.getBaseUrl().replaceAll("/+$", ""); }
    private String nonce() { byte[] bytes = new byte[16]; random.nextBytes(bytes); return HexFormat.of().formatHex(bytes); }
    private String sha256(String value) { try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); } catch (Exception exception) { throw new IllegalStateException("MCN income facts body hash failed", exception); } }
    private String hmac(String value) { try { Mac mac = Mac.getInstance("HmacSHA256"); mac.init(new SecretKeySpec(properties.getHmacSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256")); return HexFormat.of().formatHex(mac.doFinal(value.getBytes(StandardCharsets.UTF_8))); } catch (Exception exception) { throw new IllegalStateException("MCN income facts signing failure", exception); } }
    private Integer retryAfter(HttpResponse<?> response) { try { String value = response.headers().firstValue("Retry-After").orElse(null); return value == null ? null : Integer.parseInt(value); } catch (Exception ignored) { return null; } }
}
