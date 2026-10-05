package com.fenxiao.distribution.service;

import com.fenxiao.distribution.domain.LinkyVerificationSource;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class LinkyEligibilityRefreshScheduler {

    private final LinkyRegistrationEligibilityService linkyRegistrationEligibilityService;
    private final LinkyVerificationModeService verificationMode;

    public LinkyEligibilityRefreshScheduler(LinkyRegistrationEligibilityService linkyRegistrationEligibilityService,
                                            LinkyVerificationModeService verificationMode) {
        this.linkyRegistrationEligibilityService = linkyRegistrationEligibilityService;
        this.verificationMode = verificationMode;
    }

    @Scheduled(cron = "0 0 */6 * * *")
    public void refreshAllLinkyEligibility() {
        // The script probe is only valid for local legacy verification. MCN bindings
        // must never be downgraded by an unrelated legacy refresh failure.
        if (verificationMode.source() == LinkyVerificationSource.LEGACY) {
            linkyRegistrationEligibilityService.refreshAllEligibility();
        }
    }
}
