package com.fenxiao.platform.mcn;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Component
public class McnTimoRequestSigner {
    public static final String PATH = "/api/external/timo/v2/joined-guild-at/batch-query";
    public static final String SCOPE = "timo.joined_guild_at.read";
    private final ObjectMapper objectMapper;

    public McnTimoRequestSigner(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public SignedRequest sign(McnTimoBatchQuery body, String credentialId, String secret,
                              long timestamp, String nonce, String requestId) {
        if (credentialId == null || credentialId.isBlank() || secret == null || secret.isBlank()) {
            throw new IllegalStateException("MCN verification client is not configured; credentials are required before enabling verification");
        }
        try {
            byte[] rawBody = objectMapper.writeValueAsBytes(body);
            String bodyHash = sha256(rawBody);
            String canonical = String.join("\n", "POST", PATH, SCOPE, Long.toString(timestamp), nonce, requestId, bodyHash);
            String signature = hmacSha256(secret, canonical);
            return new SignedRequest(new String(rawBody, StandardCharsets.UTF_8), bodyHash, canonical, signature,
                    credentialId, timestamp, nonce, requestId);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("could not serialize MCN verification request", exception);
        }
    }

    private String sha256(byte[] rawBody) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(rawBody));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private String hmacSha256(String secret, String canonical) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(canonical.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("could not sign MCN verification request", exception);
        }
    }

    public record SignedRequest(String rawBody, String bodyHash, String canonical, String signature,
                                String credentialId, long timestamp, String nonce, String requestId) {}
}
