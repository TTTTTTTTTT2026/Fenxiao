package com.fenxiao.platform.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class PlatformGuildDirectorySyncScheduler {
    private final McnGuildDirectoryClient client;
    private final PlatformGuildDirectoryService directory;
    public PlatformGuildDirectorySyncScheduler(McnGuildDirectoryClient client, PlatformGuildDirectoryService directory) {
        this.client = client; this.directory = directory;
    }
    @Scheduled(cron = "${app.platform-guild-directory.sync-cron:0 15 * * * *}")
    public void syncAllPlatforms() {
        if (!client.enabled()) return;
        sync("LINKY");
        sync("TIMO");
    }
    private void sync(String platform) {
        try {
            directory.applyCompleteSnapshot(client.fetchCompleteSnapshot(platform));
        } catch (RuntimeException error) {
            directory.recordFailedSync(platform, error);
        }
    }
}
