package com.fenxiao.platform.service;

import com.fenxiao.platform.domain.PlatformBindingStatus;
import com.fenxiao.platform.domain.PlatformVerificationSource;
import com.fenxiao.platform.entity.PlatformAccountBinding;
import com.fenxiao.platform.entity.PlatformVerificationAttempt;
import com.fenxiao.platform.mcn.McnTimoVerificationClient;
import com.fenxiao.platform.repository.PlatformAccountBindingRepository;
import com.fenxiao.platform.repository.PlatformVerificationAttemptRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.concurrent.ThreadLocalRandom;
import java.util.List;

@Component
public class McnTimoVerificationRetryScheduler {
    private static final Logger log = LoggerFactory.getLogger(McnTimoVerificationRetryScheduler.class);
    private static final List<Duration> RETRY_DELAYS = List.of(
            Duration.ofSeconds(30), Duration.ofMinutes(2), Duration.ofMinutes(5));
    private final PlatformVerificationModeService mode;
    private final McnTimoVerificationClient client;
    private final PlatformAccountBindingRepository bindings;
    private final PlatformVerificationAttemptRepository attempts;
    private final PlatformBindingVerificationService verificationService;
    private final Clock clock;

    public McnTimoVerificationRetryScheduler(PlatformVerificationModeService mode, McnTimoVerificationClient client,
                                              PlatformAccountBindingRepository bindings, PlatformVerificationAttemptRepository attempts,
                                              PlatformBindingVerificationService verificationService, Clock clock) {
        this.mode = mode;
        this.client = client;
        this.bindings = bindings;
        this.attempts = attempts;
        this.verificationService = verificationService;
        this.clock = clock;
    }

    @Scheduled(fixedDelayString = "${app.platform-verification.mcn.timo.retry-poll-interval:60000}")
    public void retryDueTimoVerifications() {
        if (mode.source() != PlatformVerificationSource.MCN || !client.isConfigured()) return;
        LocalDateTime now = LocalDateTime.now(clock);
        for (PlatformAccountBinding binding : bindings.findByBindingStatusAndPlatformCode(PlatformBindingStatus.VERIFYING, "TIMO")) {
            attempts.findTopByBindingIdOrderByAttemptedAtDesc(binding.getId()).ifPresent(last -> retryIfDue(binding, last, now));
        }
    }

    private void retryIfDue(PlatformAccountBinding binding, PlatformVerificationAttempt last, LocalDateTime now) {
        if (!last.isRetryable()) return;
        long retryableAttempts = attempts.countByBindingIdAndRetryableTrue(binding.getId());
        if (retryableAttempts > RETRY_DELAYS.size()) {
            attempts.save(PlatformVerificationAttempt.manualReviewRequired(binding, now));
            log.warn("MCN Timo verification retries exhausted for bindingId={}; manual review is required", binding.getId());
            return;
        }
        Duration delay = retryDelay(last, retryableAttempts);
        if (now.isBefore(last.getAttemptedAt().plus(delay))) return;
        try {
            verificationService.verifySubmittedBinding(binding.getUserId(), binding.getPlatformCode());
        } catch (RuntimeException exception) {
            log.warn("MCN Timo verification retry failed for bindingId={}: {}", binding.getId(), exception.getMessage());
        }
    }

    private Duration retryDelay(PlatformVerificationAttempt last, long retryableAttempts) {
        if ("request_rate_limited".equals(last.getErrorCode()) || "live_rate_limited".equals(last.getErrorCode())
                || "local_rate_limited".equals(last.getErrorCode())) {
            return Duration.ofMinutes(1);
        }
        Duration base = RETRY_DELAYS.get((int) retryableAttempts - 1);
        long jitterPercent = ThreadLocalRandom.current().nextLong(10, 31);
        return base.plusMillis(base.toMillis() * jitterPercent / 100);
    }
}
