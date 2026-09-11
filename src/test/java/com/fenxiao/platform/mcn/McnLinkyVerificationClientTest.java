package com.fenxiao.platform.mcn;

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
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class McnLinkyVerificationClientTest {
    @Test
    @SuppressWarnings("unchecked")
    void shouldCallTheV1EndpointWithOnlyTheContractedBodyAndSignedHeaders() throws Exception {
        McnLinkyVerificationProperties properties = new McnLinkyVerificationProperties();
        properties.setEnabled(true);
        properties.setBaseUrl("https://mcn.example.test/");
        properties.setCredentialId("bandeira-linky-v1-test");
        properties.setHmacSecret("test-secret-only");
        properties.setRequestTimeout(Duration.ofSeconds(60));
        RecordingHttpClient httpClient = new RecordingHttpClient();
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(200);
        when(response.body()).thenReturn("{\"ok\":true,\"apiVersion\":\"1\",\"requestId\":\"server-request\",\"platform\":\"LINKY\",\"lookupMode\":\"LIVE_REQUIRED\",\"queriedAt\":\"2026-09-11T09:00:00Z\",\"results\":[{\"platform\":\"LINKY\",\"subjectId\":\"12345678\",\"status\":\"found\",\"membershipStatus\":\"IN_EXPECTED_GUILD\",\"expectedGuildScope\":{\"guildId\":\"39694876\",\"guildName\":\"HotSozinha\"},\"observedGuildScope\":{\"guildId\":\"39694876\",\"guildName\":\"HotSozinha\"},\"sourceScope\":\"LIVE_REQUIRED\",\"snapshotAt\":\"2026-09-11T09:00:00Z\",\"sourceGeneration\":\"g1\",\"checksum\":\"c1\",\"error\":null}]}");
        httpClient.response = response;
        Clock clock = Clock.fixed(Instant.parse("2026-09-11T09:00:00Z"), ZoneOffset.UTC);
        McnLinkyVerificationClient client = new McnLinkyVerificationClient(properties,
                new McnLinkyRequestSigner(new ObjectMapper()), new ObjectMapper(), clock,
                new McnLinkyRequestRateLimiter(clock), httpClient);

        McnLinkyVerificationClient.QueryResponse actual = client.query("12345678", "39694876");

        assertThat(actual.response().results()).hasSize(1);
        assertThat(httpClient.request.uri().toString()).isEqualTo("https://mcn.example.test/api/external/linky/v1/guild-membership/batch-query");
        assertThat(httpClient.request.headers().firstValue("X-MCN-Scope")).contains("linky.guild_membership.read");
        assertThat(httpClient.request.headers().firstValue("X-Request-Id"))
                .isEqualTo(httpClient.request.headers().firstValue("X-Idempotency-Key"));
        assertThat(httpClient.request.timeout()).contains(Duration.ofSeconds(60));
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
