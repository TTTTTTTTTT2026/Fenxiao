package com.fenxiao.platform.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
public record VerifyPlatformBindingRequest(
        @NotBlank String platformCode,
        @NotBlank String platformUserId,
        boolean globallySeenBeforeSubmission,
        boolean joinedTargetGuild,
        @NotBlank String officialGuildId,
        @NotNull LocalDateTime officialJoinedAt,
        @NotBlank String sourceSystem,
        String sourceReference,
        Long bindingId
) {
    public VerifyPlatformBindingRequest(String platformCode, String platformUserId, boolean globallySeenBeforeSubmission,
                                        boolean joinedTargetGuild, String officialGuildId, LocalDateTime officialJoinedAt,
                                        String sourceSystem, String sourceReference) {
        this(platformCode, platformUserId, globallySeenBeforeSubmission, joinedTargetGuild, officialGuildId,
                officialJoinedAt, sourceSystem, sourceReference, null);
    }
}

