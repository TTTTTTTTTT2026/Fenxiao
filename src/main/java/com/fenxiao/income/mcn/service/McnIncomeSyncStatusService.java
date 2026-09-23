package com.fenxiao.income.mcn.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fenxiao.income.mcn.api.dto.McnIncomeSyncStatusResponse;
import com.fenxiao.income.mcn.entity.McnIncomeSyncCheckpoint;
import com.fenxiao.income.mcn.entity.McnIncomeSyncRun;
import com.fenxiao.income.mcn.entity.McnIncomeAccountSyncCheckpoint;
import com.fenxiao.income.mcn.external.McnIncomeFactsProperties;
import com.fenxiao.income.mcn.repository.McnIncomeAccountSyncCheckpointRepository;
import com.fenxiao.income.mcn.repository.McnIncomeSyncCheckpointRepository;
import com.fenxiao.income.mcn.repository.McnIncomeSyncRunRepository;
import com.fenxiao.platform.domain.PlatformBindingStatus;
import com.fenxiao.platform.repository.PlatformAccountBindingRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class McnIncomeSyncStatusService {
    private final McnIncomeFactsProperties properties;
    private final McnIncomeSyncCheckpointRepository checkpoints;
    private final McnIncomeSyncRunRepository runs;
    private final McnIncomeAccountSyncCheckpointRepository accountCheckpoints;
    private final PlatformAccountBindingRepository bindings;
    private final ObjectMapper json;

    public McnIncomeSyncStatusService(McnIncomeFactsProperties properties, McnIncomeSyncCheckpointRepository checkpoints,
                                      McnIncomeSyncRunRepository runs,
                                      McnIncomeAccountSyncCheckpointRepository accountCheckpoints,
                                      PlatformAccountBindingRepository bindings, ObjectMapper json) {
        this.properties = properties; this.checkpoints = checkpoints; this.runs = runs;
        this.accountCheckpoints = accountCheckpoints; this.bindings = bindings; this.json = json;
    }

    public McnIncomeSyncStatusResponse status() {
        return new McnIncomeSyncStatusResponse(properties.isRegisteredUserScopedPullEnabled(), Math.max(1, Math.min(properties.getMaxPagesPerRun(), 100)),
                List.of(platform("TIMO"), platform("LINKY")));
    }

    private McnIncomeSyncStatusResponse.PlatformStatus platform(String code) {
        McnIncomeSyncCheckpoint checkpoint = checkpoints.findById(code).orElse(null);
        McnIncomeSyncRun run = runs.findTopByPlatformCodeOrderByCompletedAtDescIdDesc(code).orElse(null);
        var verifiedIds = bindings.findByBindingStatusAndPlatformCode(PlatformBindingStatus.VERIFIED, code).stream()
                .map(binding -> binding.getPlatformUserId())
                .filter(id -> id != null && !id.isBlank()).collect(java.util.stream.Collectors.toSet());
        List<McnIncomeAccountSyncCheckpoint> accountStates = accountCheckpoints.findByPlatformCode(code).stream()
                .filter(state -> verifiedIds.contains(state.getPlatformUserId())).toList();
        return new McnIncomeSyncStatusResponse.PlatformStatus(code, checkpoint == null ? "NEVER_RUN" : checkpoint.getLastSyncStatus(),
                checkpoint == null ? null : checkpoint.getLastSuccessAt(), checkpoint == null ? null : checkpoint.getLastSnapshotAt(),
                checkpoint == null ? null : completeness(checkpoint.getLastSourceWatermark()), checkpoint == null ? null : checkpoint.getNextAttemptAt(),
                checkpoint == null ? null : checkpoint.getLastErrorCode(), run == null ? null : run.getSyncStatus(),
                run == null ? null : run.getCompletedAt(), run == null ? 0 : run.getReceivedCount(), run == null ? 0 : run.getNewCount(),
                run == null ? 0 : run.getDuplicateCount(), run == null ? 0 : run.getUnmatchedCount(), run == null ? null : run.getRetryAfterSeconds(),
                verifiedIds.size(), (int) accountStates.stream().filter(state -> state.getLastSuccessAt() != null).count(),
                (int) accountStates.stream().filter(state -> state.getRecoveryStage() != null && !"BLOCKED".equals(state.getRecoveryStage())).count(),
                (int) accountStates.stream().filter(state -> "FAILED".equals(state.getLastSyncStatus())).count());
    }

    private String completeness(String watermark) {
        if (watermark == null || watermark.isBlank()) return null;
        try { return json.readTree(watermark).path("completeness").asText(null); }
        catch (Exception ignored) { return "INVALID"; }
    }
}
