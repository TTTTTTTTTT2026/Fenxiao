package com.fenxiao.platform.service;

import com.fenxiao.platform.domain.PlatformVerificationOutcome;

import java.time.LocalDateTime;

public record PlatformVerificationResult(
        PlatformVerificationOutcome outcome,
        boolean globallySeenBeforeSubmission,
        boolean joinedTargetGuild,
        String officialGuildId,
        LocalDateTime officialJoinedAt,
        String sourceSystem,
        String sourceReference,
        String requestId,
        String snapshotAt,
        String sourceGeneration,
        String checksum,
        String errorCode,
        boolean retryable) {

    public static PlatformVerificationResult found(boolean globallySeenBeforeSubmission, String officialGuildId,
                                                    LocalDateTime officialJoinedAt, String sourceSystem,
                                                    String sourceReference) {
        return new PlatformVerificationResult(PlatformVerificationOutcome.FOUND, globallySeenBeforeSubmission, true,
                officialGuildId, officialJoinedAt, sourceSystem, sourceReference, null, null, null, null, null, false);
    }
}
