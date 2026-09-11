package com.fenxiao.platform.mcn;

import org.springframework.boot.context.properties.ConfigurationProperties;
import java.time.Duration;

@ConfigurationProperties(prefix = "app.platform-guild-directory.mcn")
public class McnGuildDirectoryProperties {
    private boolean enabled; private String baseUrl = ""; private String credentialId = ""; private String hmacSecret = "";
    private Duration connectTimeout = Duration.ofSeconds(5); private Duration requestTimeout = Duration.ofSeconds(15); private int pageSize = 100;
    public boolean isEnabled() { return enabled; } public void setEnabled(boolean value) { enabled = value; }
    public String getBaseUrl() { return baseUrl; } public void setBaseUrl(String value) { baseUrl = value; }
    public String getCredentialId() { return credentialId; } public void setCredentialId(String value) { credentialId = value; }
    public String getHmacSecret() { return hmacSecret; } public void setHmacSecret(String value) { hmacSecret = value; }
    public Duration getConnectTimeout() { return connectTimeout; } public void setConnectTimeout(Duration value) { connectTimeout = value; }
    public Duration getRequestTimeout() { return requestTimeout; } public void setRequestTimeout(Duration value) { requestTimeout = value; }
    public int getPageSize() { return pageSize; } public void setPageSize(int value) { pageSize = value; }
    public boolean isConfigured() { return enabled && text(baseUrl) && text(credentialId) && text(hmacSecret); }
    private boolean text(String value) { return value != null && !value.isBlank(); }
}
