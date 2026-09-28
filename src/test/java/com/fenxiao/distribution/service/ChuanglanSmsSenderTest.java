package com.fenxiao.distribution.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ChuanglanSmsSenderTest {
    private static final Clock FIXED_CLOCK = Clock.fixed(Instant.parse("2026-09-28T10:00:00Z"), ZoneOffset.UTC);

    @Test
    void signsSortedNonemptyFieldsExactlyAsTheProviderRequires() {
        assertThat(ChuanglanSmsSender.sign("1234567890", Map.of(
                "msg", "[BANDEIRA] code 123456", "mobile", "85250000001", "account", "I1234567"), "secret"))
                .isEqualTo("221993cc1e5612cae4824a7ca646002f");
    }

    @Test
    void requiresCredentialsAndAnExplicitTestNumberAllowlist() {
        var properties = properties();
        properties.setPassword("");
        assertThatThrownBy(() -> new ChuanglanSmsSender(properties, new ObjectMapper(), mock(HttpClient.class), FIXED_CLOCK))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("credentials");
        properties.setPassword("test-password");
        properties.setTestNumbers("");
        assertThatThrownBy(() -> new ChuanglanSmsSender(properties, new ObjectMapper(), mock(HttpClient.class), FIXED_CLOCK))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("allowlist");
    }

    @Test
    void submitsOnlyTheAllowedNumberToTheSingaporeEndpoint() throws Exception {
        HttpClient http = mock(HttpClient.class);
        @SuppressWarnings("unchecked") HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(200);
        when(response.body()).thenReturn("{\"code\":\"0\",\"data\":{\"messageId\":\"test-id\"}}");
        doReturn(response).when(http).send(any(), any());
        var sender = new ChuanglanSmsSender(properties(), new ObjectMapper(), http, FIXED_CLOCK);

        sender.sendVerificationCode("+852 5000 0001", "123456", 10);

        var request = org.mockito.ArgumentCaptor.forClass(HttpRequest.class);
        verify(http).send(request.capture(), any());
        assertThat(request.getValue().uri().toString()).isEqualTo("https://sg-intapi.tig253.com/send/sms");
        assertThat(request.getValue().headers().firstValue("nonce")).isPresent();
        assertThat(request.getValue().headers().firstValue("sign")).isPresent();
        assertThat(request.getValue().method()).isEqualTo("POST");
        assertThatThrownBy(() -> sender.sendVerificationCode("+628123456789", "123456", 10))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("not allowed");
        verifyNoMoreInteractions(http);
    }

    @Test
    void rejectsProviderFailureWithoutTreatingItAsSent() throws Exception {
        HttpClient http = mock(HttpClient.class);
        @SuppressWarnings("unchecked") HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(200);
        when(response.body()).thenReturn("{\"code\":\"114\",\"message\":\"IP mismatch\"}");
        doReturn(response).when(http).send(any(), any());
        var sender = new ChuanglanSmsSender(properties(), new ObjectMapper(), http, FIXED_CLOCK);

        assertThatThrownBy(() -> sender.sendVerificationCode("+85250000001", "123456", 10))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("temporarily unavailable");
    }

    private ChuanglanSmsProperties properties() {
        var properties = new ChuanglanSmsProperties();
        properties.setAccount("I1234567");
        properties.setPassword("test-password");
        properties.setTestNumbers("+85250000001");
        return properties;
    }
}
