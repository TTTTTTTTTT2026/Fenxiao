package com.fenxiao.income.mcn.api;

import com.fenxiao.common.security.DistributionAccessGuard;
import com.fenxiao.income.mcn.api.dto.McnIncomeSyncStatusResponse;
import com.fenxiao.income.mcn.service.McnIncomeSyncStatusService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Read-only operational visibility. This endpoint cannot enable or trigger the scheduled consumer. */
@RestController
@RequestMapping("/admin/income-facts/sync-status")
public class McnIncomeSyncStatusAdminController {
    private final DistributionAccessGuard access; private final McnIncomeSyncStatusService service;
    public McnIncomeSyncStatusAdminController(DistributionAccessGuard access, McnIncomeSyncStatusService service) { this.access = access; this.service = service; }
    @GetMapping
    public McnIncomeSyncStatusResponse status(@RequestHeader(value = "X-Admin-Token", required = false) String token,
                                              @RequestHeader(value = "X-Admin-Session", required = false) String session) {
        access.assertFinanceAccess(token, session); return service.status();
    }
}
