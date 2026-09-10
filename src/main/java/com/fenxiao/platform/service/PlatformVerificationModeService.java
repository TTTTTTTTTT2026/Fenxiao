package com.fenxiao.platform.service;

import com.fenxiao.platform.domain.PlatformVerificationSource;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

@Service
public class PlatformVerificationModeService {
    private final PlatformVerificationSource source;
    private final Environment environment;

    public PlatformVerificationModeService(@Value("${app.platform-verification.source:MCN}") String source,
                                           Environment environment) {
        this.source = PlatformVerificationSource.parse(source);
        this.environment = environment;
    }

    @PostConstruct
    void validateEnvironment() {
        if (source == PlatformVerificationSource.MOCK && !isNonProductionProfile()) {
            throw new IllegalStateException("MOCK platform verification is allowed only in the local or test profile");
        }
    }

    public PlatformVerificationSource source() { return source; }
    public boolean mockManagementEnabled() { return source == PlatformVerificationSource.MOCK && isNonProductionProfile(); }

    public void requireMockManagement() {
        if (!mockManagementEnabled()) {
            throw new IllegalStateException("mock platform verification is disabled in this environment");
        }
    }

    public String explanation() {
        return switch (source) {
            case MOCK -> "当前为本地模拟核验；不会请求 MCN 中台，也不会产生真实发奖。";
            case MCN -> "当前为 MCN 正式核验通道；凭据仅能由部署环境提供。";
            case DISABLED -> "平台账号核验通道已关闭。";
        };
    }

    private boolean isNonProductionProfile() {
        return environment.matchesProfiles("local | test");
    }
}
