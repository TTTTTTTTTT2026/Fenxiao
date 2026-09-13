package com.fenxiao.income.mcn.entity;

import com.fenxiao.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;

import java.time.Instant;

/** Audit trail for a bounded production read-only smoke operation. No facts or credentials are stored here. */
@Entity
@Table(name = "mcn_income_controlled_read_run")
public class McnIncomeControlledReadRun extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "run_id", nullable = false, length = 64) private String runId;
    @Column(name = "operation_type", nullable = false, length = 32) private String operationType;
    @Column(name = "platform_code", nullable = false, length = 32) private String platformCode;
    @Column(name = "request_id", nullable = false, length = 128) private String requestId;
    @Column(name = "request_body_hash", nullable = false, length = 64) private String requestBodyHash;
    @Column(name = "input_cursor", length = 1024) private String inputCursor;
    @Column(name = "next_cursor", length = 1024) private String nextCursor;
    @Column(name = "delivery_hash", length = 64) private String deliveryHash;
    @Column(name = "source_status", nullable = false, length = 32) private String sourceStatus;
    @Column(name = "http_status", nullable = false) private int httpStatus;
    @Column(name = "latency_millis", nullable = false) private long latencyMillis;
    @Column(name = "fact_count", nullable = false) private int factCount;
    @Column(name = "new_count", nullable = false) private int newCount;
    @Column(name = "duplicate_count", nullable = false) private int duplicateCount;
    @Column(name = "unmatched_count", nullable = false) private int unmatchedCount;
    @Column(name = "comparison_status", length = 32) private String comparisonStatus;
    @Column(name = "retry_after_seconds") private Integer retryAfterSeconds;
    @Lob @Column(name = "source_watermark", columnDefinition = "LONGTEXT") private String sourceWatermark;
    @Column(name = "started_at", nullable = false) private Instant startedAt;
    @Column(name = "completed_at", nullable = false) private Instant completedAt;

    protected McnIncomeControlledReadRun() { }

    public static McnIncomeControlledReadRun changes(String runId, String platformCode, String requestId,
                                                       String bodyHash, String inputCursor, String nextCursor,
                                                       String deliveryHash, String sourceStatus, int httpStatus,
                                                       long latencyMillis, int factCount, int newCount,
                                                       int duplicateCount, int unmatchedCount, Integer retryAfterSeconds,
                                                       String sourceWatermark, Instant at) {
        McnIncomeControlledReadRun run = base(runId, "CHANGES", platformCode, requestId, bodyHash, sourceStatus,
                httpStatus, latencyMillis, sourceWatermark, at);
        run.inputCursor = inputCursor; run.nextCursor = nextCursor; run.deliveryHash = deliveryHash;
        run.factCount = factCount; run.newCount = newCount; run.duplicateCount = duplicateCount;
        run.unmatchedCount = unmatchedCount; run.retryAfterSeconds = retryAfterSeconds;
        return run;
    }

    public static McnIncomeControlledReadRun reconciliation(String runId, String platformCode, String requestId,
                                                              String bodyHash, String sourceStatus, int httpStatus,
                                                              long latencyMillis, String comparisonStatus,
                                                              Integer retryAfterSeconds, String sourceWatermark,
                                                              Instant at) {
        McnIncomeControlledReadRun run = base(runId, "RECONCILIATION", platformCode, requestId, bodyHash,
                sourceStatus, httpStatus, latencyMillis, sourceWatermark, at);
        run.comparisonStatus = comparisonStatus; run.retryAfterSeconds = retryAfterSeconds;
        return run;
    }

    private static McnIncomeControlledReadRun base(String runId, String operationType, String platformCode,
                                                    String requestId, String bodyHash, String sourceStatus,
                                                    int httpStatus, long latencyMillis, String sourceWatermark, Instant at) {
        McnIncomeControlledReadRun run = new McnIncomeControlledReadRun();
        run.runId = runId; run.operationType = operationType; run.platformCode = platformCode;
        run.requestId = requestId; run.requestBodyHash = bodyHash; run.sourceStatus = sourceStatus;
        run.httpStatus = httpStatus; run.latencyMillis = latencyMillis; run.sourceWatermark = sourceWatermark;
        run.startedAt = at; run.completedAt = at;
        return run;
    }
}
