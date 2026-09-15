package com.fenxiao.income.mcn.service;

import com.fenxiao.income.mcn.api.dto.McnIncomeSyncStatusResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fenxiao.income.mcn.entity.McnIncomeSyncRun;
import com.fenxiao.income.mcn.external.McnIncomeFactsProperties;
import com.fenxiao.income.mcn.repository.McnIncomeSyncCheckpointRepository;
import com.fenxiao.income.mcn.repository.McnIncomeSyncRunRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;

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
        when(checkpoints.findById("TIMO")).thenReturn(Optional.empty());
        when(checkpoints.findById("LINKY")).thenReturn(Optional.empty());
        when(runs.findTopByPlatformCodeOrderByCompletedAtDescIdDesc("TIMO")).thenReturn(Optional.empty());
        when(runs.findTopByPlatformCodeOrderByCompletedAtDescIdDesc("LINKY")).thenReturn(Optional.empty());

        McnIncomeSyncStatusResponse result = new McnIncomeSyncStatusService(properties, checkpoints, runs, new ObjectMapper()).status();

        assertThat(result.continuousPullEnabled()).isFalse();
        assertThat(result.maxPagesPerRun()).isEqualTo(100);
        assertThat(result.platforms()).extracting(McnIncomeSyncStatusResponse.PlatformStatus::platformCode).containsExactly("TIMO", "LINKY");
        assertThat(result.platforms()).allSatisfy(item -> {
            assertThat(item.checkpointStatus()).isEqualTo("NEVER_RUN");
            assertThat(item.lastSuccessAt()).isNull();
            assertThat(item.latestRunStatus()).isNull();
        });
    }
}
