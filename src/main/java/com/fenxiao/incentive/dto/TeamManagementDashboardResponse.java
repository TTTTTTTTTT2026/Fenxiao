package com.fenxiao.incentive.dto;

import java.util.List;

/** Read-only operating team view. Team governance is separate from payout execution. */
public record TeamManagementDashboardResponse(
        long activeTeamCount,
        long leaderTeamCount,
        long operatingProfitShareEnabledTeamCount,
        long activeMemberRelationCount,
        List<TeamManagementItemResponse> teams) {
}
