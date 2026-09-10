package com.fenxiao.platform.service;

import java.time.LocalDateTime;

public record PlatformVerificationResult(
        boolean globallySeenBeforeSubmission,
        boolean joinedTargetGuild,
        String officialGuildId,
        LocalDateTime officialJoinedAt,
        String sourceSystem,
        String sourceReference) {
}
