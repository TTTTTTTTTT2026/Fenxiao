package com.fenxiao.platform.mcn;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.net.Authenticator;
import java.net.CookieHandler;
import java.net.ProxySelector;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLParameters;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class McnTimoVerificationClientTest {
    @Test
    @SuppressWarnings("unchecked")
    void shouldCallTheV3EndpointWithTheRequiredSignedHeaders() throws Exception {
        McnTimoVerificationProperties properties = new McnTimoVerificationProperties();
        properties.setEnabled(true);
        properties.setBaseUrl("https://mcn.example.test/");
        properties.setCredentialId("bandeira-timo-v3-test");
        properties.setHmacSecret("test-secret-only");
        properties.setRequestTimeout(Duration.ofSeconds(50));
        RecordingHttpClient httpClient = new RecordingHttpClient();
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(200);
        when(response.body()).thenReturn("{\"ok\":true,\"apiVersion\":\"3\",\"requestId\":\"server-request\",\"platform\":\"TIMO\",\"queriedAt\":\"2026-09-10T16:20:30+08:00\",\"results\":[]}");
        httpClient.response = response;
        McnTimoVerificationClient client = new McnTimoVerificationClient(properties,
                new McnTimoRequestSigner(new ObjectMapper()), new ObjectMapper(),
                Clock.fixed(Instant.parse("2026-09-10T08:20:30Z"), ZoneOffset.UTC),
                new McnTimoRequestRateLimiter(Clock.fixed(Instant.parse("2026-09-10T08:20:30Z"), ZoneOffset.UTC)), httpClient);

        client.query("999999999999", "22000408", "Mexico");

        assertThat(httpClient.request.uri().toString()).isEqualTo("https://mcn.example.test/api/external/timo/v3/joined-guild-at/batch-query");
        assertThat(httpClient.request.headers().firstValue("Content-Type")).contains("application/json; charset=utf-8");
        assertThat(httpClient.request.headers().firstValue("X-MCN-Credential-Id")).contains("bandeira-timo-v3-test");
        assertThat(httpClient.request.headers().firstValue("X-MCN-Scope")).contains("timo.joined_guild_at.read");
        assertThat(httpClient.request.headers().firstValue("X-Request-Id")).isPresent();
        assertThat(httpClient.request.headers().firstValue("X-Request-Id"))
                .isEqualTo(httpClient.request.headers().firstValue("X-Idempotency-Key"));
        assertThat(httpClient.request.timeout()).contains(Duration.ofSeconds(50));
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
        @Override @SuppressWarnings("unchecked")
        public <T> HttpResponse<T> send(HttpRequest request, HttpResponse.BodyHandler<T> handler) {
            this.request = request;
            return (HttpResponse<T>) response;
        }
        @Override @SuppressWarnings("unchecked")
        public <T> CompletableFuture<HttpResponse<T>> sendAsync(HttpRequest request, HttpResponse.BodyHandler<T> handler) {
            return CompletableFuture.completedFuture((HttpResponse<T>) response);
        }
        @Override @SuppressWarnings("unchecked")
        public <T> CompletableFuture<HttpResponse<T>> sendAsync(HttpRequest request, HttpResponse.BodyHandler<T> handler,
                                                                 HttpResponse.PushPromiseHandler<T> pushPromiseHandler) {
            return CompletableFuture.completedFuture((HttpResponse<T>) response);
        }
    }
}
