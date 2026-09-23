package com.fenxiao.income.mcn.service;

import com.fenxiao.income.mcn.api.dto.McnIncomeSyncStatusResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fenxiao.income.mcn.entity.McnIncomeSyncRun;
import com.fenxiao.income.mcn.entity.McnIncomeAccountSyncCheckpoint;
import com.fenxiao.income.mcn.external.McnIncomeFactsProperties;
import com.fenxiao.income.mcn.repository.McnIncomeSyncCheckpointRepository;
import com.fenxiao.income.mcn.repository.McnIncomeSyncRunRepository;
import com.fenxiao.income.mcn.repository.McnIncomeAccountSyncCheckpointRepository;
import com.fenxiao.platform.domain.PlatformBindingStatus;
import com.fenxiao.platform.repository.PlatformAccountBindingRepository;
import com.fenxiao.platform.entity.PlatformAccountBinding;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class McnIncomeSyncStatusServiceTest {
    @Test
    void reportsOnlyOperationalStateWhenTheConsumerIsDisabled() {
        McnIncomeFactsProperties properties = new McnIncomeFactsProperties();
        properties.setMaxPagesPerRun(500);
        McnIncomeSyncCheckpointRepository checkpoints = mock(McnIncomeSyncCheckpointRepository.class);
        McnIncomeSyncRunRepository runs = mock(McnIncomeSyncRunRepository.class);
        McnIncomeAccountSyncCheckpointRepository accountCheckpoints = mock(McnIncomeAccountSyncCheckpointRepository.class);
        PlatformAccountBindingRepository bindings = mock(PlatformAccountBindingRepository.class);
        when(accountCheckpoints.findByPlatformCode("TIMO")).thenReturn(List.of());
        when(accountCheckpoints.findByPlatformCode("LINKY")).thenReturn(List.of());
        when(bindings.findByBindingStatusAndPlatformCode(PlatformBindingStatus.VERIFIED, "TIMO")).thenReturn(List.of());
        when(bindings.findByBindingStatusAndPlatformCode(PlatformBindingStatus.VERIFIED, "LINKY")).thenReturn(List.of());
        when(checkpoints.findById("TIMO")).thenReturn(Optional.empty());
        when(checkpoints.findById("LINKY")).thenReturn(Optional.empty());
        when(runs.findTopByPlatformCodeOrderByCompletedAtDescIdDesc("TIMO")).thenReturn(Optional.empty());
        when(runs.findTopByPlatformCodeOrderByCompletedAtDescIdDesc("LINKY")).thenReturn(Optional.empty());

        McnIncomeSyncStatusResponse result = new McnIncomeSyncStatusService(properties, checkpoints, runs,
                accountCheckpoints, bindings, new ObjectMapper()).status();

        assertThat(result.continuousPullEnabled()).isFalse();
        assertThat(result.maxPagesPerRun()).isEqualTo(100);
        assertThat(result.platforms()).extracting(McnIncomeSyncStatusResponse.PlatformStatus::platformCode).containsExactly("TIMO", "LINKY");
        assertThat(result.platforms()).allSatisfy(item -> {
            assertThat(item.checkpointStatus()).isEqualTo("NEVER_RUN");
            assertThat(item.lastSuccessAt()).isNull();
            assertThat(item.latestRunStatus()).isNull();
            assertThat(item.verifiedAccountCount()).isZero();
        });
    }

    @Test
    void reportsVerifiedAccountProgressWithoutExposingAccountIds() {
        McnIncomeFactsProperties properties = new McnIncomeFactsProperties();
        McnIncomeSyncCheckpointRepository checkpoints = mock(McnIncomeSyncCheckpointRepository.class);
        McnIncomeSyncRunRepository runs = mock(McnIncomeSyncRunRepository.class);
        McnIncomeAccountSyncCheckpointRepository accountCheckpoints = mock(McnIncomeAccountSyncCheckpointRepository.class);
        PlatformAccountBindingRepository bindings = mock(PlatformAccountBindingRepository.class);
        PlatformAccountBinding verified = mock(PlatformAccountBinding.class);
        when(verified.getPlatformUserId()).thenReturn("01234567");
        when(bindings.findByBindingStatusAndPlatformCode(PlatformBindingStatus.VERIFIED, "LINKY"))
                .thenReturn(List.of(verified));
        McnIncomeAccountSyncCheckpoint read = McnIncomeAccountSyncCheckpoint.initial("LINKY", "01234567");
        read.advance("opaque", Instant.parse("2026-09-23T09:00:00Z"), "{}", Instant.parse("2026-09-23T09:00:00Z"));
        when(accountCheckpoints.findByPlatformCode("LINKY")).thenReturn(List.of(read));

        var result = new McnIncomeSyncStatusService(properties, checkpoints, runs, accountCheckpoints,
                bindings, new ObjectMapper()).status();
        var linky = result.platforms().get(1);
        assertThat(linky.verifiedAccountCount()).isEqualTo(1);
        assertThat(linky.readAccountCount()).isEqualTo(1);
        assertThat(linky.recoveringAccountCount()).isZero();
        assertThat(linky.failedAccountCount()).isZero();
        assertThat(new ObjectMapper().valueToTree(result).toString()).doesNotContain("01234567", "opaque");
    }
}
