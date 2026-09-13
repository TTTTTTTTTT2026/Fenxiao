package com.fenxiao.income.mcn.api;

import com.fenxiao.common.security.DistributionAccessGuard;
import com.fenxiao.income.mcn.api.dto.McnIncomeControlledChangesRequest;
import com.fenxiao.income.mcn.api.dto.McnIncomeControlledChangesResponse;
import com.fenxiao.income.mcn.api.dto.McnIncomeControlledReconciliationRequest;
import com.fenxiao.income.mcn.api.dto.McnIncomeControlledReconciliationResponse;
import com.fenxiao.income.mcn.service.McnIncomeControlledReadOnlyService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Finance-only production smoke API. It has no route to enable the scheduled consumer. */
@RestController
@RequestMapping("/admin/income-facts/controlled-read-only")
public class McnIncomeControlledReadOnlyAdminController {
    private final DistributionAccessGuard accessGuard;
    private final McnIncomeControlledReadOnlyService service;

    public McnIncomeControlledReadOnlyAdminController(DistributionAccessGuard accessGuard,
                                                      McnIncomeControlledReadOnlyService service) {
        this.accessGuard = accessGuard; this.service = service;
    }

    @PostMapping("/changes")
    public McnIncomeControlledChangesResponse changes(@RequestHeader(value = "X-Admin-Token", required = false) String adminToken,
                                                      @RequestHeader(value = "X-Admin-Session", required = false) String adminSession,
                                                      @Valid @RequestBody McnIncomeControlledChangesRequest request) {
        accessGuard.assertFinanceAccess(adminToken, adminSession);
        return service.readChanges(request);
    }

    @PostMapping("/reconciliation")
    public McnIncomeControlledReconciliationResponse reconciliation(@RequestHeader(value = "X-Admin-Token", required = false) String adminToken,
                                                                    @RequestHeader(value = "X-Admin-Session", required = false) String adminSession,
                                                                    @Valid @RequestBody McnIncomeControlledReconciliationRequest request) {
        accessGuard.assertFinanceAccess(adminToken, adminSession);
        return service.reconcile(request);
    }
}
