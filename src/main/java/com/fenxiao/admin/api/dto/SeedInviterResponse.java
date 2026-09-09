package com.fenxiao.admin.api.dto;

public record SeedInviterResponse(
        long userId,
        String phoneNumber,
        String countryCode,
        String languageCode,
        String inviteCode) {
}
