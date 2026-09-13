package com.fenxiao.income.mcn.external;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLParameters;
import java.net.Authenticator;
import java.net.CookieHandler;
import java.net.ProxySelector;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class McnIncomeFactsHttpClientTest {
    @Test
    @SuppressWarnings("unchecked")
    void shouldReuseTheCallerRequestIdForAnExactControlledChangesRetry() throws Exception {
        RecordingHttpClient http = new RecordingHttpClient();
        http.response = response("{\"ok\":true,\"apiVersion\":\"1\",\"requestId\":\"server-request\",\"deliveryId\":\"delivery-1\",\"platformCode\":\"LINKY\",\"snapshotAt\":\"2026-09-13T08:00:00Z\",\"sourceStatus\":\"READY\",\"sourceWatermark\":{},\"facts\":[],\"nextCursor\":\"cursor-next\",\"hasMore\":false}");
        McnIncomeFactsHttpClient client = client(http);
        McnIncomeFactsQuery query = new McnIncomeFactsQuery("LINKY", null, 2,
                LocalDate.of(2026, 9, 11), LocalDate.of(2026, 9, 11));
        McnIncomeFactsRequestContext context = new McnIncomeFactsRequestContext("same-request-id");

        McnIncomeFactsQueryResult first = client.query(query, context);
        HttpRequest firstRequest = http.request;
        McnIncomeFactsQueryResult second = client.query(query, context);
        HttpRequest secondRequest = http.request;

        assertThat(first.audit().bodySha256()).isEqualTo(second.audit().bodySha256());
        assertThat(firstRequest.headers().firstValue("X-Request-Id")).contains("same-request-id");
        assertThat(secondRequest.headers().firstValue("X-Idempotency-Key")).contains("same-request-id");
        assertThat(firstRequest.headers().firstValue("X-MCN-Nonce"))
                .isNotEqualTo(secondRequest.headers().firstValue("X-MCN-Nonce"));
        assertThat(second.page().nextCursor()).isEqualTo("cursor-next");
    }

    @Test
    @SuppressWarnings("unchecked")
    void shouldCallTheDedicatedReconciliationScope() {
        RecordingHttpClient http = new RecordingHttpClient();
        http.response = response("{\"ok\":true,\"apiVersion\":\"1\",\"requestId\":\"server-reconciliation\",\"platformCode\":\"LINKY\",\"snapshotId\":\"snapshot-1\",\"snapshotAt\":\"2026-09-13T08:00:00Z\",\"sourceStatus\":\"READY\",\"sourceWatermark\":{},\"businessDateFrom\":\"2026-09-11\",\"businessDateTo\":\"2026-09-11\",\"groups\":[{\"businessDate\":\"2026-09-11\",\"guildId\":\"43536425\",\"settlementStatus\":\"SETTLED\",\"amountUnit\":\"LINKY_DIAMOND\",\"currencyCode\":\"XXX\",\"factCount\":1,\"absoluteAmountTotal\":\"99\",\"projectionChecksum\":\"checksum\"}]}");

        McnIncomeFactsReconciliationResult result = client(http).reconcile(new McnIncomeFactsReconciliationQuery(
                "LINKY", LocalDate.of(2026, 9, 11), LocalDate.of(2026, 9, 11), java.util.List.of("43536425")));

        assertThat(http.request.uri().getPath()).isEqualTo(McnIncomeFactsHttpClient.RECONCILIATION_PATH);
        assertThat(http.request.headers().firstValue("X-MCN-Scope")).contains(McnIncomeFactsHttpClient.RECONCILIATION_SCOPE);
        assertThat(result.page().groups()).hasSize(1);
        assertThat(result.page().groups().getFirst().absoluteAmountTotal().toPlainString()).isEqualTo("99");
    }

    private McnIncomeFactsHttpClient client(RecordingHttpClient http) {
        McnIncomeFactsProperties properties = new McnIncomeFactsProperties();
        properties.setBaseUrl("https://mcn.example.test/");
        properties.setCredentialId("test-credential");
        properties.setHmacSecret("test-secret-only");
        properties.setRequestTimeout(Duration.ofSeconds(5));
        return new McnIncomeFactsHttpClient(properties, new ObjectMapper(),
                Clock.fixed(Instant.parse("2026-09-13T08:00:00Z"), ZoneOffset.UTC), http);
    }

    private HttpResponse<String> response(String body) {
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(200);
        when(response.body()).thenReturn(body);
        return response;
    }

    private static final class RecordingHttpClient extends HttpClient {
        private HttpRequest request;
        private HttpResponse<String> response;
        @Override public Optional<CookieHandler> cookieHandler() { return Optional.empty(); }
        @Override public Optional<Duration> connectTimeout() { return Optional.empty(); }
        @Override public Redirect followRedirects() { return Redirect.NEVER; }
        @Override public Optional<ProxySelector> proxy() { return Optional.empty(); }
        @Override public SSLContext sslContext() { return null; }
        @Override public SSLParameters sslParameters() { return new SSLParameters(); }
        @Override public Optional<Authenticator> authenticator() { return Optional.empty(); }
        @Override public Version version() { return Version.HTTP_1_1; }
        @Override public Optional<Executor> executor() { return Optional.empty(); }
        @Override @SuppressWarnings("unchecked") public <T> HttpResponse<T> send(HttpRequest request, HttpResponse.BodyHandler<T> handler) { this.request = request; return (HttpResponse<T>) response; }
        @Override @SuppressWarnings("unchecked") public <T> CompletableFuture<HttpResponse<T>> sendAsync(HttpRequest request, HttpResponse.BodyHandler<T> handler) { return CompletableFuture.completedFuture((HttpResponse<T>) response); }
        @Override @SuppressWarnings("unchecked") public <T> CompletableFuture<HttpResponse<T>> sendAsync(HttpRequest request, HttpResponse.BodyHandler<T> handler, HttpResponse.PushPromiseHandler<T> pushPromiseHandler) { return CompletableFuture.completedFuture((HttpResponse<T>) response); }
    }
}
