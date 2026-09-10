package com.fenxiao.platform.mcn;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

class McnTimoRequestRateLimiterTest {
    @Test
    void shouldFailClosedAfterTheConfiguredRollingMinuteLimit() {
        McnTimoRequestRateLimiter limiter = new McnTimoRequestRateLimiter(
                Clock.fixed(Instant.parse("2026-09-10T08:20:30Z"), ZoneOffset.UTC));

        assertThat(limiter.tryAcquire(2)).isTrue();
        assertThat(limiter.tryAcquire(2)).isTrue();
        assertThat(limiter.tryAcquire(2)).isFalse();
    }
}
