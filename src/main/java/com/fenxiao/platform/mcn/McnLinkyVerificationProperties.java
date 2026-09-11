package com.fenxiao.platform.mcn;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.List;

@ConfigurationProperties(prefix = "app.linky-verification.mcn")
public class McnLinkyVerificationProperties {
    private boolean enabled;
    private String baseUrl = "";
    private String credentialId = "";
    private String hmacSecret = "";
    private Duration connectTimeout = Duration.ofSeconds(5);
    private Duration requestTimeout = Duration.ofSeconds(60);
    private int requestsPerMinute = 10;
    private List<String> allowedGuildIds = List.of("42569347", "39694876", "43536425", "31350499", "25400979", "48636809", "38556710");

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    public String getCredentialId() { return credentialId; }
    public void setCredentialId(String credentialId) { this.credentialId = credentialId; }
    public String getHmacSecret() { return hmacSecret; }
    public void setHmacSecret(String hmacSecret) { this.hmacSecret = hmacSecret; }
    public Duration getConnectTimeout() { return connectTimeout; }
    public void setConnectTimeout(Duration connectTimeout) { this.connectTimeout = connectTimeout; }
    public Duration getRequestTimeout() { return requestTimeout; }
    public void setRequestTimeout(Duration requestTimeout) { this.requestTimeout = requestTimeout; }
    public int getRequestsPerMinute() { return requestsPerMinute; }
    public void setRequestsPerMinute(int requestsPerMinute) { this.requestsPerMinute = requestsPerMinute; }
    public List<String> getAllowedGuildIds() { return allowedGuildIds; }
    public void setAllowedGuildIds(List<String> allowedGuildIds) { this.allowedGuildIds = allowedGuildIds == null ? List.of() : List.copyOf(allowedGuildIds); }

    public boolean isConfigured() {
        return enabled && hasText(baseUrl) && hasText(credentialId) && hasText(hmacSecret);
    }
    public boolean isAllowedGuildId(String value) { return value != null && allowedGuildIds.contains(value); }
    private boolean hasText(String value) { return value != null && !value.isBlank(); }
}
