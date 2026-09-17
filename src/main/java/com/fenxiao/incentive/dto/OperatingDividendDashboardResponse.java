package com.fenxiao.incentive.dto;

import java.util.List;

public record OperatingDividendDashboardResponse(
        long activePolicyCount, long qualificationCount, long profitFactCount, long shadowEntryCount,
        List<OperatingDividendPolicyResponse> policies,
        List<OperatingDividendProfitFactResponse> recentProfitFacts,
        List<OperatingDividendShadowEntryResponse> recentShadowEntries) {
}
