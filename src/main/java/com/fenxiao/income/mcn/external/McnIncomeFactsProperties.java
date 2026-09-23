package com.fenxiao.income.mcn.external;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "app.mcn-income-facts")
public class McnIncomeFactsProperties {
    private boolean enabled;
    /**
     * Allows an authorised administrator to run an explicitly date-bounded, read-only
     * production smoke test. It never starts the scheduled consumer.
     */
    private boolean controlledReadOnlyEnabled;
    private String baseUrl = "";
    private String credentialId = "";
    private String hmacSecret = "";
    private Duration connectTimeout = Duration.ofSeconds(5);
    private Duration requestTimeout = Duration.ofSeconds(20);
    private int pageSize = 200;
    private int maxPagesPerRun = 10;
    private int requestsPerMinute = 30;
    private Duration syncInterval = Duration.ofMinutes(5);
    /** A non-final daily watermark is never consumable by the scheduled reader. */
    private Duration finalityRetryDelay = Duration.ofMinutes(15);

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public boolean isControlledReadOnlyEnabled() { return controlledReadOnlyEnabled; }
    public void setControlledReadOnlyEnabled(boolean controlledReadOnlyEnabled) { this.controlledReadOnlyEnabled = controlledReadOnlyEnabled; }
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
    public int getRequestsPerMinute() { return requestsPerMinute; }
    public void setRequestsPerMinute(int requestsPerMinute) { this.requestsPerMinute = requestsPerMinute; }
    public Duration getSyncInterval() { return syncInterval; }
    public void setSyncInterval(Duration syncInterval) { this.syncInterval = syncInterval; }
    public Duration getFinalityRetryDelay() { return finalityRetryDelay; }
    public void setFinalityRetryDelay(Duration finalityRetryDelay) { this.finalityRetryDelay = finalityRetryDelay; }

    /** A credential may be installed while both execution switches remain off. */
    public boolean isCredentialConfigured() {
        return hasText(baseUrl) && hasText(credentialId) && hasText(hmacSecret);
    }

    public boolean isContinuousPullEnabled() { return enabled && isCredentialConfigured(); }

    /** V2 requests require an explicit, verified account scope and validate the echoed scope. */
    public boolean isRegisteredUserScopedPullEnabled() {
        return isContinuousPullEnabled();
    }

    public boolean isControlledReadOnlyConfigured() { return controlledReadOnlyEnabled && isCredentialConfigured(); }

    /** Controlled reads must obey the same account-scope boundary as scheduled income reads. */
    public boolean isRegisteredUserScopedControlledReadOnlyConfigured() {
        return isControlledReadOnlyConfigured();
    }

    private boolean hasText(String value) { return value != null && !value.isBlank(); }
}
