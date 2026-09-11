package com.fenxiao.admin.api.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateLinkyInvitationGuildRequest(
        @NotBlank String guildId,
        @NotBlank String guildName,
        String guildInviteCode,
        @NotBlank String reason
) {}
