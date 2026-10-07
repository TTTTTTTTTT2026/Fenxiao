package com.fenxiao.distribution.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Flow;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ChuanglanSmsSenderTest {
    private static final Clock FIXED_CLOCK = Clock.fixed(Instant.parse("2026-09-28T10:00:00Z"), ZoneOffset.UTC);

    @Test
    void selectsOneLocalLanguagePerSupportedCallingCode() {
        assertThat(ChuanglanSmsSender.verificationMessage("628123456789", "123123", 10))
                .isEqualTo("[BANDEIRA] kode verifikasi anda adalah 123123");
        assertThat(ChuanglanSmsSender.verificationMessage("8613800000000", "123123", 10))
                .isEqualTo("[BANDEIRA] 您的验证码是 123123");
        assertThat(ChuanglanSmsSender.verificationMessage("85250000001", "123123", 10))
                .isEqualTo("[BANDEIRA] 您的驗證碼是 123123");
        assertThat(ChuanglanSmsSender.verificationMessage("525512345678", "123123", 10))
                .isEqualTo("[BANDEIRA] Su código de verificación es 123123");
        assertThat(ChuanglanSmsSender.verificationMessage("5511999999999", "123123", 10))
                .isEqualTo("[BANDEIRA] Seu código de verificação é 123123");
        assertThat(ChuanglanSmsSender.verificationMessage("15551234567", "123123", 10))
                .isEqualTo("[BANDEIRA] Your verification code is 123123. Valid for 10 minutes. Do not share it.");
    }

    @Test
    void signsSortedNonemptyFieldsExactlyAsTheProviderRequires() {
        assertThat(ChuanglanSmsSender.sign("1234567890", Map.of(
                "msg", "[BANDEIRA] code 123456", "mobile", "85250000001", "account", "I1234567"), "secret"))
                .isEqualTo("221993cc1e5612cae4824a7ca646002f");
    }

    @Test
    void requiresCredentialsButNoRecipientAllowlist() {
        var properties = properties();
        properties.setPassword("");
        assertThatThrownBy(() -> new ChuanglanSmsSender(properties, new ObjectMapper(), mock(HttpClient.class), FIXED_CLOCK))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining("credentials");
        properties.setPassword("test-password");
        assertThat(new ChuanglanSmsSender(properties, new ObjectMapper(), mock(HttpClient.class), FIXED_CLOCK))
                .isNotNull();
    }

    @Test
    void submitsValidNumbersWithoutAnAllowlistToTheSingaporeEndpoint() throws Exception {
        HttpClient http = mock(HttpClient.class);
        @SuppressWarnings("unchecked") HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(200);
        when(response.body()).thenReturn("{\"code\":\"0\",\"data\":{\"messageId\":\"test-id\"}}");
        doReturn(response).when(http).send(any(), any());
        var sender = new ChuanglanSmsSender(properties(), new ObjectMapper(), http, FIXED_CLOCK);

        sender.sendVerificationCode("+852 5000 0001", "123456", 10);
        sender.sendVerificationCode("+628123456789", "654321", 10);

        var request = org.mockito.ArgumentCaptor.forClass(HttpRequest.class);
        verify(http, times(2)).send(request.capture(), any());
        assertThat(request.getAllValues()).allSatisfy(sent -> {
            assertThat(sent.uri().toString()).isEqualTo("https://sg-intapi.tig253.com/send/sms");
            assertThat(sent.headers().firstValue("nonce")).isPresent();
            assertThat(sent.headers().firstValue("sign")).isPresent();
            assertThat(sent.method()).isEqualTo("POST");
        });
        ObjectMapper json = new ObjectMapper();
        assertThat(json.readTree(requestBody(request.getAllValues().get(0))).path("msg").asText())
                .isEqualTo("[BANDEIRA] 您的驗證碼是 123456");
        assertThat(json.readTree(requestBody(request.getAllValues().get(1))).path("msg").asText())
                .isEqualTo("[BANDEIRA] kode verifikasi anda adalah 654321");
        assertThatThrownBy(() -> sender.sendVerificationCode("001234", "123456", 10))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("country code");
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
                .isInstanceOf(SmsSubmissionException.class).hasMessageContaining("temporarily unavailable")
                .satisfies(error -> assertThat(((SmsSubmissionException) error).getErrorCode()).isEqualTo("PROVIDER_114"));
    }

    private ChuanglanSmsProperties properties() {
        var properties = new ChuanglanSmsProperties();
        properties.setAccount("I1234567");
        properties.setPassword("test-password");
        return properties;
    }

    private String requestBody(HttpRequest request) {
        var body = new ByteArrayOutputStream();
        var done = new CompletableFuture<Void>();
        request.bodyPublisher().orElseThrow().subscribe(new Flow.Subscriber<ByteBuffer>() {
            @Override public void onSubscribe(Flow.Subscription subscription) { subscription.request(Long.MAX_VALUE); }
            @Override public void onNext(ByteBuffer chunk) {
                byte[] bytes = new byte[chunk.remaining()];
                chunk.get(bytes);
                body.writeBytes(bytes);
            }
            @Override public void onError(Throwable error) { done.completeExceptionally(error); }
            @Override public void onComplete() { done.complete(null); }
        });
        done.join();
        return body.toString(StandardCharsets.UTF_8);
    }
}
