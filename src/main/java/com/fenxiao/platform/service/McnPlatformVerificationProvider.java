package com.fenxiao.platform.service;

import com.fenxiao.platform.domain.PlatformVerificationOutcome;
import com.fenxiao.platform.domain.PlatformVerificationSource;
import com.fenxiao.platform.mcn.McnTimoBatchResponse;
import com.fenxiao.platform.mcn.McnTimoTransportException;
import com.fenxiao.platform.mcn.McnTimoVerificationClient;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Locale;

@Component
public class McnPlatformVerificationProvider implements PlatformVerificationProvider {
    private static final DateTimeFormatter BEIJING_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private final McnTimoVerificationClient client;

    public McnPlatformVerificationProvider(McnTimoVerificationClient client) {
        this.client = client;
    }

    @Override
    public PlatformVerificationSource source() { return PlatformVerificationSource.MCN; }

    @Override
    public PlatformVerificationResult verify(PlatformVerificationRequest request) {
        if (!"TIMO".equals(request.platformCode())) {
            throw new IllegalStateException("MCN verification is currently available only for TIMO");
        }
        if (request.expectedGuildId() == null || request.expectedCountry() == null) {
            throw new IllegalStateException("MCN Timo verification requires an expected guild and country");
        }
        try {
            McnTimoBatchResponse response = client.query(request.platformUserId(), request.expectedGuildId(), request.expectedCountry());
            McnTimoBatchResponse.Result result = response.results() == null ? null : response.results().stream()
                    .filter(value -> request.platformUserId().equals(value.subjectId())).findFirst().orElse(null);
            if (result == null) return error(response.requestId(), "missing_subject_result", true, null, null, null, null);
            return map(response.requestId(), request.expectedGuildId(), result);
        } catch (McnTimoTransportException exception) {
            return error(exception.getRequestId(), exception.getErrorCode(), exception.isRetryable(), null, null, null, null);
        }
    }

    private PlatformVerificationResult map(String requestId, String expectedGuildId, McnTimoBatchResponse.Result result) {
        String status = result.status() == null ? "error" : result.status().trim().toLowerCase(Locale.ROOT);
        String officialGuildId = result.guildScope() == null ? null : result.guildScope().guildId();
        String reference = requestId == null ? "mcn:timo" : "mcn:" + requestId;
        if ("found".equals(status)) {
            if (!expectedGuildId.equals(officialGuildId)) {
                return error(requestId, "expected_guild_mismatch", false, officialGuildId, result, reference, null);
            }
            LocalDateTime joinedAt = parseJoinedAt(result.joinedGuildAtBj());
            if (joinedAt == null) return error(requestId, "formal_join_time_missing", false, officialGuildId, result, reference, null);
            return new PlatformVerificationResult(PlatformVerificationOutcome.FOUND, false, true, officialGuildId, joinedAt,
                    "MCN_TIMO", reference, requestId, result.snapshotAt(), result.sourceGeneration(), result.checksum(), null, false);
        }
        if ("not_found".equals(status)) {
            return new PlatformVerificationResult(PlatformVerificationOutcome.NOT_FOUND, false, false, officialGuildId, null,
                    "MCN_TIMO", reference, requestId, result.snapshotAt(), result.sourceGeneration(), result.checksum(), "not_found", false);
        }
        if ("source_stale".equals(status)) {
            String code = result.error() == null ? "source_stale" : result.error().code();
            return new PlatformVerificationResult(PlatformVerificationOutcome.SOURCE_STALE, false, false, officialGuildId, null,
                    "MCN_TIMO", reference, requestId, result.snapshotAt(), result.sourceGeneration(), result.checksum(), code, true);
        }
        String code = result.error() == null ? "mcn_error" : result.error().code();
        boolean retryable = result.error() != null && result.error().retryable();
        return error(requestId, code, retryable, officialGuildId, result, reference, null);
    }

    private PlatformVerificationResult error(String requestId, String code, boolean retryable, String officialGuildId,
                                             McnTimoBatchResponse.Result result, String reference, LocalDateTime joinedAt) {
        return new PlatformVerificationResult(PlatformVerificationOutcome.ERROR, false, false, officialGuildId, joinedAt,
                "MCN_TIMO", reference == null ? "mcn:timo" : reference, requestId,
                result == null ? null : result.snapshotAt(), result == null ? null : result.sourceGeneration(),
                result == null ? null : result.checksum(), code == null ? "mcn_error" : code, retryable);
    }

    private LocalDateTime parseJoinedAt(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDateTime.parse(value, BEIJING_TIME);
        } catch (DateTimeParseException ignored) {
            try {
                return LocalDateTime.parse(value);
            } catch (DateTimeParseException invalid) {
                return null;
            }
        }
    }
}
