package com.fenxiao.incentive.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TeamManagementItemResponse(
        long teamId,
        String teamCode,
        String teamName,
        String countryCode,
        Long leaderUserId,
        String leaderPhoneNumber,
        String leaderQualificationStatus,
        String teamEstablishmentStatus,
        String leaderAppointmentStatus,
        String leadershipSource,
        LocalDateTime leaderAppointedAt,
        boolean operatingProfitShareEnabled,
        Long parentTeamId,
        String parentTeamCode,
        long activeMemberCount,
        String latestPlatformCode,
        LocalDate latestPeriodEnd,
        Long latestOperatingProfitMinor,
        String latestCurrencyCode,
        LocalDateTime createdAt) {
}
