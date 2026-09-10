package com.fenxiao.platform.dto;

import com.fenxiao.platform.entity.PlatformVerificationMock;

public record PlatformVerificationMockResponse(
        Long id,
        String platformCode,
        String platformUserId,
        boolean globallySeenBeforeSubmission,
        boolean joinedTargetGuild,
        String officialGuildId,
        String officialJoinedAt,
        String sourceReference,
        boolean enabled) {
    public static PlatformVerificationMockResponse from(PlatformVerificationMock value) {
        return new PlatformVerificationMockResponse(value.getId(), value.getPlatformCode(), value.getPlatformUserId(),
                value.isGloballySeenBeforeSubmission(), value.isJoinedTargetGuild(), value.getOfficialGuildId(),
                value.getOfficialJoinedAt().toString(), value.getSourceReference(), value.isEnabled());
    }
}
