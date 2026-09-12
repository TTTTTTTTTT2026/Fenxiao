package com.fenxiao.admin.api.dto;

import java.util.List;

public record UserPlatformProfileListResponse(List<Item> items, long total, int page, int size) {
    public record Item(Long userId, String inviteCode, String countryCode, String phoneNumber, Long directInviterUserId,
                       PlatformBinding linky, PlatformBinding timo, InvitationGuild invitationGuild) {}
    public record PlatformBinding(String accountId, String status, String guildId, String guildName,
                                  String verifiedAt, String source, String expectedGuildSource) {}
    public record InvitationGuild(String guildId, String guildName, String guildInviteCode, String source,
                                  Long inheritedFromUserId, String effectiveAt, String changeReason) {}
}
