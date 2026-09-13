package com.fenxiao.income.mcn.api;

import com.fenxiao.common.security.DistributionAccessGuard;
import com.fenxiao.income.mcn.api.dto.McnIncomeShadowLedgerRefreshRequest;
import com.fenxiao.income.mcn.api.dto.McnIncomeShadowLedgerSummaryResponse;
import com.fenxiao.income.mcn.service.McnIncomeShadowLedgerService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/admin/income-facts/shadow-ledger")
public class McnIncomeShadowLedgerAdminController {
    private final DistributionAccessGuard access; private final McnIncomeShadowLedgerService service;
    public McnIncomeShadowLedgerAdminController(DistributionAccessGuard access, McnIncomeShadowLedgerService service) { this.access = access; this.service = service; }
    @PostMapping("/refresh")
    public McnIncomeShadowLedgerSummaryResponse refresh(@RequestHeader(value = "X-Admin-Token", required = false) String token, @RequestHeader(value = "X-Admin-Session", required = false) String session, @Valid @RequestBody McnIncomeShadowLedgerRefreshRequest request) { access.assertFinanceAccess(token, session); return service.refresh(request.platformCode(), request.businessDate()); }
    @GetMapping("/summary")
    public McnIncomeShadowLedgerSummaryResponse summary(@RequestHeader(value = "X-Admin-Token", required = false) String token, @RequestHeader(value = "X-Admin-Session", required = false) String session, @RequestParam String platformCode, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate businessDate) { access.assertFinanceAccess(token, session); return service.summary(platformCode, businessDate); }
}
