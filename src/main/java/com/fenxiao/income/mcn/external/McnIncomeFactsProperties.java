package com.fenxiao.income.mcn.external;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "app.mcn-income-facts")
public class McnIncomeFactsProperties {
    private boolean enabled;
    private String baseUrl = "";
    private String credentialId = "";
    private String hmacSecret = "";
    private Duration connectTimeout = Duration.ofSeconds(5);
    private Duration requestTimeout = Duration.ofSeconds(20);
    private int pageSize = 200;
    private int maxPagesPerRun = 10;
    private Duration syncInterval = Duration.ofMinutes(5);

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
    public int getPageSize() { return pageSize; }
    public void setPageSize(int pageSize) { this.pageSize = pageSize; }
    public int getMaxPagesPerRun() { return maxPagesPerRun; }
    public void setMaxPagesPerRun(int maxPagesPerRun) { this.maxPagesPerRun = maxPagesPerRun; }
    public Duration getSyncInterval() { return syncInterval; }
    public void setSyncInterval(Duration syncInterval) { this.syncInterval = syncInterval; }

    public boolean isConfigured() {
        return enabled && hasText(baseUrl) && hasText(credentialId) && hasText(hmacSecret);
    }

    private boolean hasText(String value) { return value != null && !value.isBlank(); }
}
