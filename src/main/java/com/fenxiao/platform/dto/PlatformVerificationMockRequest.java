package com.fenxiao.platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record PlatformVerificationMockRequest(
        @NotBlank String platformCode,
        @NotBlank String platformUserId,
        boolean globallySeenBeforeSubmission,
        boolean joinedTargetGuild,
        @NotBlank String officialGuildId,
        @NotNull LocalDateTime officialJoinedAt,
        String sourceReference,
        boolean enabled) {
}
