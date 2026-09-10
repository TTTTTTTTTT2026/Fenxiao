package com.fenxiao.platform.mcn;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;

@Component
public class McnTimoRequestRateLimiter {
    private static final Duration WINDOW = Duration.ofMinutes(1);
    private final Clock clock;
    private final Deque<Instant> requests = new ArrayDeque<>();

    public McnTimoRequestRateLimiter(Clock clock) {
        this.clock = clock;
    }

    public synchronized boolean tryAcquire(int maximumRequestsPerMinute) {
        Instant earliestAllowed = clock.instant().minus(WINDOW);
        while (!requests.isEmpty() && !requests.peekFirst().isAfter(earliestAllowed)) requests.removeFirst();
        if (requests.size() >= maximumRequestsPerMinute) return false;
        requests.addLast(clock.instant());
        return true;
    }
}
