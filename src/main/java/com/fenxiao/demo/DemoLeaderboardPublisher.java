package com.fenxiao.demo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Profile("!test")
public class DemoLeaderboardPublisher {
    private static final Logger log = LoggerFactory.getLogger(DemoLeaderboardPublisher.class);
    private final DemoLeaderboardService service;
    public DemoLeaderboardPublisher(DemoLeaderboardService service) { this.service = service; }

    @EventListener(ApplicationReadyEvent.class)
    public void onStartup() { publish(); }

    @Scheduled(cron = "${app.consumer-demo-leaderboard.publish-cron:0 10 0 * * *}", zone = "UTC")
    public void publish() {
        try { service.publishDue(); }
        catch (RuntimeException error) {
            // Preserve the previous snapshot; never substitute real account data or fabricated freshness.
            log.warn("Demo leaderboard publication failed; previous snapshot retained ({})", error.getClass().getSimpleName());
        }
    }
}
