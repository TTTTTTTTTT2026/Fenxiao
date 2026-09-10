package com.fenxiao.platform.mcn;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.SecureRandom;
import java.time.Clock;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.UUID;

@Component
@EnableConfigurationProperties(McnTimoVerificationProperties.class)
public class McnTimoVerificationClient {
    private final McnTimoVerificationProperties properties;
    private final McnTimoRequestSigner signer;
    private final ObjectMapper objectMapper;
    private final Clock clock;
    private final McnTimoRequestRateLimiter rateLimiter;
    private final HttpClient httpClient;
    private final SecureRandom random = new SecureRandom();

    @Autowired
    public McnTimoVerificationClient(McnTimoVerificationProperties properties, McnTimoRequestSigner signer,
                                     ObjectMapper objectMapper, Clock clock, McnTimoRequestRateLimiter rateLimiter) {
        this(properties, signer, objectMapper, clock, rateLimiter,
                HttpClient.newBuilder().connectTimeout(properties.getConnectTimeout()).build());
    }

    McnTimoVerificationClient(McnTimoVerificationProperties properties, McnTimoRequestSigner signer,
                              ObjectMapper objectMapper, Clock clock, McnTimoRequestRateLimiter rateLimiter,
                              HttpClient httpClient) {
        this.properties = properties;
        this.signer = signer;
        this.objectMapper = objectMapper;
        this.clock = clock;
        this.rateLimiter = rateLimiter;
        this.httpClient = httpClient;
    }

    public boolean isConfigured() { return properties.isConfigured(); }

    public McnTimoBatchResponse query(String subjectId, String expectedGuildId, String expectedCountry) {
        requireConfigured();
        String requestId = UUID.randomUUID().toString();
        if (!rateLimiter.tryAcquire(properties.getRequestsPerMinute())) {
            throw new McnTimoTransportException(429, "local_rate_limited", true, requestId);
        }
        String nonce = nextNonce();
        McnTimoBatchQuery body = new McnTimoBatchQuery("TIMO", "CURRENT_THEN_LIVE",
                java.util.List.of(new McnTimoBatchQuery.Subject(subjectId, expectedGuildId, expectedCountry)));
        McnTimoRequestSigner.SignedRequest signed = signer.sign(body, properties.getCredentialId(), properties.getHmacSecret(),
                clock.instant().getEpochSecond(), nonce, requestId);
        HttpRequest request = HttpRequest.newBuilder(endpoint())
                .timeout(properties.getRequestTimeout())
                .header("Content-Type", "application/json; charset=utf-8")
                .header("X-MCN-Credential-Id", signed.credentialId())
                .header("X-MCN-Scope", McnTimoRequestSigner.SCOPE)
                .header("X-MCN-Timestamp", Long.toString(signed.timestamp()))
                .header("X-MCN-Nonce", signed.nonce())
                .header("X-Request-Id", signed.requestId())
                .header("X-Idempotency-Key", signed.requestId())
                .header("X-MCN-Signature", signed.signature())
                .POST(HttpRequest.BodyPublishers.ofByteArray(signed.rawBody().getBytes(StandardCharsets.UTF_8)))
                .build();
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new McnTimoTransportException(response.statusCode(), extractErrorCode(response.body()), retryable(response.statusCode()), signed.requestId());
            }
            McnTimoBatchResponse parsed = objectMapper.readValue(response.body(), McnTimoBatchResponse.class);
            if (!parsed.ok() || !"3".equals(parsed.apiVersion())) {
                throw new McnTimoTransportException(502, "mcn_v3_response_invalid", false, signed.requestId());
            }
            return parsed;
        } catch (IOException exception) {
            throw new McnTimoTransportException(503, "transport_error", true, signed.requestId());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new McnTimoTransportException(503, "transport_interrupted", true, signed.requestId());
        }
    }

    private void requireConfigured() {
        if (!properties.isConfigured()) {
            throw new IllegalStateException("MCN verification client is not configured; enable only after credentials are securely configured");
        }
    }

    private URI endpoint() {
        String base = properties.getBaseUrl().trim();
        if (base.endsWith("/")) base = base.substring(0, base.length() - 1);
        return URI.create(base + McnTimoRequestSigner.PATH);
    }

    private String nextNonce() {
        byte[] bytes = new byte[16];
        random.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    private String extractErrorCode(String body) {
        try {
            JsonNode detail = objectMapper.readTree(body).path("detail");
            String reason = detail.path("reason").asText();
            return reason.isBlank() ? "http_error" : reason;
        } catch (Exception ignored) {
            return "http_error";
        }
    }

    private boolean retryable(int statusCode) {
        return statusCode == 409 || statusCode == 429 || statusCode >= 500;
    }
}
