package com.fenxiao.distribution.service;

import com.fenxiao.distribution.domain.LinkyVerificationSource;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

@Service
public class LinkyVerificationModeService {
    private final LinkyVerificationSource source;
    private final Environment environment;

    public LinkyVerificationModeService(@Value("${app.linky-verification.source:MCN}") String source,
                                        Environment environment) {
        this.source = LinkyVerificationSource.parse(source);
        this.environment = environment;
    }

    @PostConstruct
    void validateEnvironment() {
        if ((source == LinkyVerificationSource.MOCK || source == LinkyVerificationSource.LEGACY)
                && !environment.matchesProfiles("local | test")) {
            throw new IllegalStateException("Only MCN Linky verification is allowed outside the local or test profile");
        }
    }

    public LinkyVerificationSource source() { return source; }
}
