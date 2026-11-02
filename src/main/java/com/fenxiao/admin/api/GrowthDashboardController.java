package com.fenxiao.admin.api;

import com.fenxiao.admin.service.AdminSessionService;
import com.fenxiao.admin.service.GrowthDashboardMetrics;
import com.fenxiao.admin.service.OperationsDashboardService;
import com.fenxiao.common.api.ForbiddenException;
import com.fenxiao.common.security.DistributionAccessGuard;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Locale;
import java.util.Set;

@RestController
@RequestMapping("/admin/distribution/operations-dashboard/growth")
public class GrowthDashboardController {
    private final DistributionAccessGuard access;
    private final GrowthDashboardMetrics growth;
    private final OperationsDashboardService existing;

    public GrowthDashboardController(DistributionAccessGuard access, GrowthDashboardMetrics growth, OperationsDashboardService existing) {
        this.access = access; this.growth = growth; this.existing = existing;
    }

    @GetMapping
    public Response report(@RequestHeader(value="X-Admin-Session", required=false) String session,
            @RequestParam String platformCode, @RequestParam(defaultValue="ALL") String countryCode,
            @RequestParam(defaultValue="today") String period) {
        AdminSessionService.AdminPrincipal p = access.assertAdminAccess(null, session);
        if (!Set.of("super_admin","admin","operations","operator","customer_support").contains(p.role().toLowerCase(Locale.ROOT))
                || !full(p.platformScope()) || !full(p.guildScope()) || !full(p.regionScope()))
            throw new ForbiddenException("global operations dashboard requires unrestricted user data scope");
        var current = existing.report(platformCode, countryCode, 7, period);
        var data = growth.report(platformCode, countryCode, period);
        boolean canSeePoints = "super_admin".equalsIgnoreCase(p.role());
        var ranks = current.missingVerificationHistoryUsers() > 0 ? List.<GrowthDashboardMetrics.RankDetail>of()
                : growth.enrich(data.ranks(), platformCode.toUpperCase(Locale.ROOT), countryCode.toUpperCase(Locale.ROOT), data.start(), data.end(), canSeePoints);
        var summary = new Summary(data.start(), data.end(), data.participatingInviters(), data.registered(), data.submitted(),
                current.missingVerificationHistoryUsers() > 0 ? null : data.verified());
        String rewardPoints = canSeePoints ? growth.campaignPoints(platformCode.toUpperCase(Locale.ROOT), countryCode.toUpperCase(Locale.ROOT), data.start(), data.end()) : null;
        String pendingPoints = canSeePoints ? growth.pendingCampaignPoints(platformCode.toUpperCase(Locale.ROOT), countryCode.toUpperCase(Locale.ROOT), data.start(), data.end()) : null;
        return new Response(summary, ranks, current.missingVerificationHistoryUsers(), canSeePoints, rewardPoints, pendingPoints);
    }

    private static boolean full(String scope) { return scope == null || scope.isBlank() || "*".equals(scope.trim()); }
    public record Summary(java.time.LocalDateTime start, java.time.LocalDateTime end, long participatingInviters,
                          long registered, long submitted, Long verified) { }
    public record Response(Summary data, List<GrowthDashboardMetrics.RankDetail> ranks,
                           long missingVerificationHistoryUsers, boolean canSeePoints, String rewardPoints, String pendingRewardPoints) { }
}
