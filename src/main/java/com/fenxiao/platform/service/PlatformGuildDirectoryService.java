package com.fenxiao.platform.service;

import com.fenxiao.platform.entity.McnGuildDirectoryItem;
import com.fenxiao.platform.entity.PlatformGuildDirectory;
import com.fenxiao.platform.entity.PlatformGuildSyncRun;
import com.fenxiao.platform.repository.PlatformGuildDirectoryRepository;
import com.fenxiao.platform.repository.PlatformGuildSyncRunRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional
public class PlatformGuildDirectoryService {
    private final PlatformGuildDirectoryRepository repository;
    private final PlatformGuildSyncRunRepository syncRuns;
    private final Clock clock;

    public PlatformGuildDirectoryService(PlatformGuildDirectoryRepository repository, PlatformGuildSyncRunRepository syncRuns) {
        this(repository, syncRuns, Clock.systemUTC());
    }

    PlatformGuildDirectoryService(PlatformGuildDirectoryRepository repository, PlatformGuildSyncRunRepository syncRuns, Clock clock) {
        this.repository = repository; this.syncRuns = syncRuns; this.clock = clock;
    }

    /** Applies one complete authoritative platform snapshot. Partial responses must never call this method. */
    public SyncOutcome applyCompleteSnapshot(McnGuildDirectorySnapshot snapshot) {
        String platform = platform(snapshot.platformCode());
        if (!snapshot.complete()) throw new IllegalArgumentException("MCN guild directory snapshot must be complete before reconciliation");
        List<McnGuildDirectoryItem> items = snapshot.items() == null ? List.of() : snapshot.items();
        String runId = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now(clock);
        int upserted = 0;
        for (McnGuildDirectoryItem item : items) {
            validate(item);
            PlatformGuildDirectory value = repository.findByPlatformCodeAndExternalGuildId(platform, item.guildId())
                    .orElseGet(() -> PlatformGuildDirectory.seen(platform, item, runId, now));
            if (value.getId() != null) value.apply(item, runId, now);
            repository.save(value); upserted++;
        }
        List<PlatformGuildDirectory> absent = repository.findByPlatformCodeAndLastSyncRunIdNot(platform, runId);
        absent.forEach(value -> value.markMissing(now));
        repository.saveAll(absent);
        syncRuns.save(PlatformGuildSyncRun.completed(runId, platform, snapshot.sourceVersion(), items.size(), upserted, absent.size(), now));
        return new SyncOutcome(platform, runId, items.size(), upserted, absent.size(), now);
    }

    public List<PlatformGuildDirectory> list(String platformCode) { return repository.findByPlatformCodeOrderByExternalGuildIdAsc(platform(platformCode)); }
    public List<PlatformGuildSyncRun> recentRuns(String platformCode) { return syncRuns.findTop20ByPlatformCodeOrderByStartedAtDesc(platform(platformCode)); }
    public void recordFailedSync(String platformCode, RuntimeException error) {
        String platform = platform(platformCode);
        syncRuns.save(PlatformGuildSyncRun.failed(UUID.randomUUID().toString(), platform, error.getClass().getSimpleName(), error.getMessage(), LocalDateTime.now(clock)));
    }

    private String platform(String value) {
        String normalized = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
        if (!"LINKY".equals(normalized) && !"TIMO".equals(normalized)) throw new IllegalArgumentException("platform must be LINKY or TIMO");
        return normalized;
    }
    private void validate(McnGuildDirectoryItem item) {
        if (item == null || blank(item.guildId()) || blank(item.guildName()) || blank(item.guildStatus())) {
            throw new IllegalArgumentException("MCN guild directory item is incomplete");
        }
    }
    private boolean blank(String value) { return value == null || value.isBlank(); }
    public record SyncOutcome(String platformCode, String runId, int receivedCount, int upsertedCount, int missingCount, LocalDateTime syncedAt) {}
}
