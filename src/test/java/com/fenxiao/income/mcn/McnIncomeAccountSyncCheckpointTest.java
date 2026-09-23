package com.fenxiao.income.mcn;

import com.fenxiao.income.mcn.entity.McnIncomeAccountSyncCheckpoint;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class McnIncomeAccountSyncCheckpointTest {
    private static final LocalDate HISTORY_START = LocalDate.of(2026, 8, 1);

    @Test
    void neverInfersFullAccountHistoryFromARegistrationOrGuildJoinDate() {
        var checkpoint = McnIncomeAccountSyncCheckpoint.initial("TIMO", "123456789012");
        checkpoint.recordHistoryStart(HISTORY_START, null);
        assertThat(checkpoint.getHistoryStart()).isEqualTo(HISTORY_START);
        assertThat(checkpoint.getHistoryCoverageStatus()).isEqualTo("UNKNOWN");
    }

    @Test
    void usesOnlyAnAuthoritativeLifecycleStartToAssessCoverage() {
        var checkpoint = McnIncomeAccountSyncCheckpoint.initial("TIMO", "123456789012");
        checkpoint.recordHistoryStart(HISTORY_START, HISTORY_START.minusDays(1));
        assertThat(checkpoint.getHistoryCoverageStatus()).isEqualTo("PARTIAL");
        checkpoint.recordHistoryStart(HISTORY_START, HISTORY_START);
        assertThat(checkpoint.getHistoryCoverageStatus()).isEqualTo("COMPLETE");
    }
}
