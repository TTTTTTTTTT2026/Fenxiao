package com.fenxiao.income.mcn.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fenxiao.income.mcn.api.dto.McnIncomeSyncStatusResponse;
import com.fenxiao.income.mcn.entity.McnIncomeSyncCheckpoint;
import com.fenxiao.income.mcn.entity.McnIncomeSyncRun;
import com.fenxiao.income.mcn.external.McnIncomeFactsProperties;
import com.fenxiao.income.mcn.repository.McnIncomeSyncCheckpointRepository;
import com.fenxiao.income.mcn.repository.McnIncomeSyncRunRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class McnIncomeSyncStatusService {
    private final McnIncomeFactsProperties properties;
    private final McnIncomeSyncCheckpointRepository checkpoints;
    private final McnIncomeSyncRunRepository runs;
    private final ObjectMapper json;

    public McnIncomeSyncStatusService(McnIncomeFactsProperties properties, McnIncomeSyncCheckpointRepository checkpoints,
                                      McnIncomeSyncRunRepository runs, ObjectMapper json) {
        this.properties = properties; this.checkpoints = checkpoints; this.runs = runs; this.json = json;
    }

    public McnIncomeSyncStatusResponse status() {
        return new McnIncomeSyncStatusResponse(properties.isContinuousPullEnabled(), Math.max(1, Math.min(properties.getMaxPagesPerRun(), 100)),
                List.of(platform("TIMO"), platform("LINKY")));
    }

    private McnIncomeSyncStatusResponse.PlatformStatus platform(String code) {
        McnIncomeSyncCheckpoint checkpoint = checkpoints.findById(code).orElse(null);
        McnIncomeSyncRun run = runs.findTopByPlatformCodeOrderByCompletedAtDescIdDesc(code).orElse(null);
        return new McnIncomeSyncStatusResponse.PlatformStatus(code, checkpoint == null ? "NEVER_RUN" : checkpoint.getLastSyncStatus(),
                checkpoint == null ? null : checkpoint.getLastSuccessAt(), checkpoint == null ? null : checkpoint.getLastSnapshotAt(),
                checkpoint == null ? null : completeness(checkpoint.getLastSourceWatermark()), checkpoint == null ? null : checkpoint.getNextAttemptAt(),
                checkpoint == null ? null : checkpoint.getLastErrorCode(), run == null ? null : run.getSyncStatus(),
                run == null ? null : run.getCompletedAt(), run == null ? 0 : run.getReceivedCount(), run == null ? 0 : run.getNewCount(),
                run == null ? 0 : run.getDuplicateCount(), run == null ? 0 : run.getUnmatchedCount(), run == null ? null : run.getRetryAfterSeconds());
    }

    private String completeness(String watermark) {
        if (watermark == null || watermark.isBlank()) return null;
        try { return json.readTree(watermark).path("completeness").asText(null); }
        catch (Exception ignored) { return "INVALID"; }
    }
}
