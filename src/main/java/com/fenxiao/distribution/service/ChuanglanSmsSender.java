package com.fenxiao.distribution.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.util.Map;
import java.util.TreeMap;
import java.util.concurrent.atomic.AtomicLong;

@Component
@ConditionalOnProperty(name = "app.sms.provider", havingValue = "CHUANGLAN")
@EnableConfigurationProperties(ChuanglanSmsProperties.class)
public class ChuanglanSmsSender implements SmsSender {
    private static final Logger log = LoggerFactory.getLogger(ChuanglanSmsSender.class);
    private static final String INDONESIA_SENDER_ID = "BANDEIRA";
    private final ChuanglanSmsProperties properties;
    private final ObjectMapper json;
    private final HttpClient http;
    private final Clock clock;
    private final URI endpoint;
    private final AtomicLong lastNonce = new AtomicLong();

    @Override
    public String deliveryChannel() { return "CHUANGLAN"; }

    @Autowired
    public ChuanglanSmsSender(ChuanglanSmsProperties properties, ObjectMapper json) {
        this(properties, json, HttpClient.newBuilder().connectTimeout(properties.getConnectTimeout()).build(), Clock.systemUTC());
    }

    ChuanglanSmsSender(ChuanglanSmsProperties properties, ObjectMapper json, HttpClient http, Clock clock) {
        this.properties = properties;
        this.json = json;
        this.http = http;
        this.clock = clock;
        if (blank(properties.getAccount()) || blank(properties.getPassword())) {
            throw new IllegalStateException("Chuanglan SMS credentials are required");
        }
        endpoint = URI.create(properties.getBaseUrl());
        if (!"https".equalsIgnoreCase(endpoint.getScheme()) || !"sg-intapi.tig253.com".equalsIgnoreCase(endpoint.getHost())
                || !"/send/sms".equals(endpoint.getPath())) {
            throw new IllegalStateException("Chuanglan SMS endpoint must be the Singapore sign/nonce HTTPS endpoint");
        }
    }

    @Override
    public void sendVerificationCode(String phoneNumber, String verificationCode, int ttlMinutes) {
        String mobile = normalizeMobile(phoneNumber);
        if (mobile.startsWith("86")) {
            throw new IllegalArgumentException("+86 verification codes must use internal audit only");
        }
        if (verificationCode == null || !verificationCode.matches("^[0-9]{6}$")) {
            throw new IllegalArgumentException("verification code must be six digits");
        }
        String nonce = Long.toString(lastNonce.updateAndGet(previous -> Math.max(clock.millis(), previous + 1)));
        Map<String, String> body = new TreeMap<>();
        body.put("account", properties.getAccount());
        body.put("mobile", mobile);
        body.put("msg", verificationMessage(mobile, verificationCode, ttlMinutes));
        if (mobile.startsWith("62")) {
            body.put("senderId", INDONESIA_SENDER_ID);
        }
        String sign = sign(nonce, body, properties.getPassword());
        try {
            HttpRequest request = HttpRequest.newBuilder(endpoint)
                    .timeout(properties.getRequestTimeout())
                    .header("Content-Type", "application/json; charset=UTF-8")
                    .header("nonce", nonce)
                    .header("sign", sign)
                    .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body), StandardCharsets.UTF_8))
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() != 200) {
                log.warn("Chuanglan SMS submission returned HTTP {}", response.statusCode());
                throw new SmsSubmissionException("HTTP_" + response.statusCode(), "verification SMS is temporarily unavailable");
            }
            JsonNode result = json.readTree(response.body());
            if (!"0".equals(result.path("code").asText())) {
                String safeCode = result.path("code").asText().matches("^[0-9]{1,6}$") ? result.path("code").asText() : "unknown";
                log.warn("Chuanglan SMS submission rejected with code {}", safeCode);
                throw new SmsSubmissionException("PROVIDER_" + safeCode, "verification SMS is temporarily unavailable");
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new SmsSubmissionException("INTERRUPTED", "verification SMS submission interrupted", exception);
        } catch (IOException exception) {
            throw new SmsSubmissionException("NETWORK_ERROR", "verification SMS could not be submitted", exception);
        }
    }

    static String sign(String nonce, Map<String, String> body, String password) {
        Map<String, String> signed = new TreeMap<>(body);
        signed.put("nonce", nonce);
        StringBuilder plain = new StringBuilder();
        signed.forEach((key, value) -> {
            if (value != null && !value.isBlank()) plain.append(key).append(value);
        });
        plain.append(password);
        try {
            byte[] digest = MessageDigest.getInstance("MD5").digest(plain.toString().getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("MD5 unavailable", exception);
        }
    }

    static String normalizeMobile(String phoneNumber) {
        String mobile = phoneNumber == null ? "" : phoneNumber.replaceAll("[\\s()+-]", "");
        if (!mobile.matches("^[1-9][0-9]{4,19}$")) {
            throw new IllegalArgumentException("SMS phone number must include a country code without 00 prefix");
        }
        return mobile;
    }

    static String verificationMessage(String mobile, String code, int ttlMinutes) {
        // Select the SMS language from the destination calling code, not the account/profile language.
        // Indonesia's registered wording is exact: do not append punctuation or expiry instructions.
        if (mobile.startsWith("62")) return "[BANDEIRA] kode verifikasi anda adalah " + code;
        if (mobile.startsWith("852")) return "[BANDEIRA] 您的驗證碼是 " + code;
        if (mobile.startsWith("52")) return "[BANDEIRA] Su código de verificación es " + code;
        if (mobile.startsWith("55")) return "[BANDEIRA] Seu código de verificação é " + code;
        // Preserve the existing wording for older accounts outside the live-SMS regions.
        return "[BANDEIRA] Your verification code is " + code + ". Valid for " + ttlMinutes + " minutes. Do not share it.";
    }

    private static boolean blank(String value) { return value == null || value.isBlank(); }
}
