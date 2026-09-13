package com.fenxiao.income.mcn.external;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

/** Implements the exact-byte HMAC contract supplied by MCN. */
public final class McnIncomeFactsRequestSigner {
    public String sha256(String rawBody) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(rawBody.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("MCN income facts body hash failed", exception);
        }
    }

    public String sign(String secret, String method, String path, String scope, long timestamp,
                       String nonce, String requestId, String rawBody) {
        String canonical = String.join("\n", method, path, scope, Long.toString(timestamp), nonce,
                requestId, sha256(rawBody));
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(canonical.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("MCN income facts signing failure", exception);
        }
    }
}
