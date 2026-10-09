package com.fenxiao.admin.api;

import com.fenxiao.admin.service.HighValueRankingService;
import com.fenxiao.common.api.ForbiddenException;
import com.fenxiao.common.security.DistributionAccessGuard;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/distribution/high-value-ranking")
public class HighValueRankingController {
    private final DistributionAccessGuard access;
    private final HighValueRankingService ranking;

    public HighValueRankingController(DistributionAccessGuard access, HighValueRankingService ranking) {
        this.access = access;
        this.ranking = ranking;
    }

    @GetMapping
    public HighValueRankingService.Report report(
            @RequestHeader(value = "X-Admin-Session", required = false) String session,
            @RequestParam String platformCode,
            @RequestParam(required = false) String guildId,
            @RequestParam String countryCode,
            @RequestParam String period,
            @RequestParam String periodValue,
            @RequestParam(required = false) Long operatorAdminId,
            @RequestParam(defaultValue = "SELF_COMMISSION") String rankingMetric,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var principal = access.assertEffectiveUserReadAccess(null, session);
        principal.requireScope(platformCode, guildId, countryCode);
        // A restricted guild operator cannot turn off their scope with the "all guilds" option.
        if ((guildId == null || guildId.isBlank() || "all".equalsIgnoreCase(guildId))
                && principal.guildScope() != null && !principal.guildScope().isBlank()
                && !"*".equals(principal.guildScope()))
            throw new ForbiddenException("admin data scope denied");
        return ranking.report(platformCode, guildId, countryCode, period, periodValue,
                operatorAdminId, rankingMetric, page, size);
    }
}
