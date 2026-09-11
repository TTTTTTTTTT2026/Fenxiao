package com.fenxiao.platform.service;

import com.fenxiao.platform.entity.McnGuildDirectoryItem;
import com.fenxiao.platform.entity.PlatformGuildDirectory;
import com.fenxiao.platform.repository.PlatformGuildDirectoryRepository;
import com.fenxiao.platform.repository.PlatformGuildSyncRunRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlatformGuildDirectoryServiceTest {
    @Mock private PlatformGuildDirectoryRepository directory;
    @Mock private PlatformGuildSyncRunRepository syncRuns;

    @Test
    void marksOnlyRecordsMissingFromACompleteSnapshot() {
        PlatformGuildDirectory old = PlatformGuildDirectory.seen("LINKY",
                new McnGuildDirectoryItem("11111111", "Old", "ACTIVE", null, null, null, null, null), "older-run", java.time.LocalDateTime.now());
        when(directory.findByPlatformCodeAndExternalGuildId("LINKY", "22222222")).thenReturn(Optional.empty());
        when(directory.findByPlatformCodeAndLastSyncRunIdNot(eq("LINKY"), anyString())).thenReturn(List.of(old));
        PlatformGuildDirectoryService service = service();

        var result = service.applyCompleteSnapshot(new McnGuildDirectorySnapshot("LINKY", true, "MCN_MANAGED_GUILDS", "snapshot-1", "v2", "sha256:test", null, null, List.of(
                new McnGuildDirectoryItem("22222222", "New", "ACTIVE", "Brazil", null, null, "v2", "JOIN-NEW")
        )));

        assertThat(result.missingCount()).isEqualTo(1);
        assertThat(old.getDirectoryStatus()).isEqualTo("MISSING_ON_MCN");
        verify(syncRuns).save(any());
    }

    @Test
    void rejectsPartialSnapshotBeforeAnyDirectoryMutation() {
        PlatformGuildDirectoryService service = service();

        assertThatThrownBy(() -> service.applyCompleteSnapshot(new McnGuildDirectorySnapshot("TIMO", false, null, null, "v3", null, null, null, List.of())))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("complete");

        verifyNoInteractions(directory, syncRuns);
    }

    private PlatformGuildDirectoryService service() {
        return new PlatformGuildDirectoryService(directory, syncRuns,
                Clock.fixed(Instant.parse("2026-09-11T09:00:00Z"), ZoneOffset.UTC));
    }
}
