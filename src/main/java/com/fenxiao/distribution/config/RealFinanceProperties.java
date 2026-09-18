package com.fenxiao.distribution.config;

import com.fenxiao.common.api.ServiceUnavailableException;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Explicit release gate for operations that can change a user's financial state.
 * Shadow calculation, local evidence and read-only history do not depend on this gate.
 */
@Component
@ConfigurationProperties(prefix = "app.distribution.real-finance")
public class RealFinanceProperties {

    private boolean enabled = false;

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public void assertWriteEnabled() {
        if (!enabled) {
            throw new ServiceUnavailableException("real finance operations are disabled");
        }
    }
}
