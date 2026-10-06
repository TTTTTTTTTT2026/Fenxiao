package com.fenxiao.income.mcn.api;

import com.fenxiao.common.security.DistributionAccessGuard;
import com.fenxiao.distribution.service.ConsumerWorkspaceService;
import com.fenxiao.income.mcn.api.dto.InvitationCommissionReportResponse;
import com.fenxiao.income.mcn.api.dto.InvitationCommissionSourceResponse;
import com.fenxiao.income.mcn.service.InvitationCommissionReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
public class InvitationCommissionReportController {
    private final DistributionAccessGuard access;
    private final ConsumerWorkspaceService workspaces;
    private final InvitationCommissionReportService reports;

    public InvitationCommissionReportController(DistributionAccessGuard access, ConsumerWorkspaceService workspaces,
                                                InvitationCommissionReportService reports) {
        this.access = access;
        this.workspaces = workspaces;
        this.reports = reports;
    }

    @GetMapping("/api/distribution/commission-reports/{userId}")
    public InvitationCommissionReportResponse report(@RequestHeader("X-Distribution-Token") String token,
            @PathVariable long userId, @RequestParam String platformCode,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        access.assertUserAccess(userId, token);
        return reports.report(userId, selectedPlatform(userId, platformCode), startDate, endDate, page, size);
    }

    @GetMapping("/api/distribution/commission-reports/{userId}/invitees/{directInviteeUserId}")
    public InvitationCommissionSourceResponse sources(@RequestHeader("X-Distribution-Token") String token,
            @PathVariable long userId, @PathVariable long directInviteeUserId, @RequestParam String platformCode,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        access.assertUserAccess(userId, token);
        return reports.sources(userId, selectedPlatform(userId, platformCode), directInviteeUserId,
                startDate, endDate, page, size);
    }

    private String selectedPlatform(long userId, String platformCode) {
        String verified = workspaces.requireVerified(userId, platformCode);
        if (!verified.equals(workspaces.get(userId).selected()))
            throw new IllegalArgumentException("platform is not the selected workspace");
        return verified;
    }
}
