package com.fenxiao.incentive.dto;

import java.util.List;

public record UserGradeLevelDashboardResponse(
        long activeLevelCount,
        UserGradeLevelResponse activeTeamLeaderLevel,
        List<UserGradeLevelResponse> levels) {
}
