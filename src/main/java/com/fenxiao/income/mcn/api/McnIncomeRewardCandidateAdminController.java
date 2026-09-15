package com.fenxiao.income.mcn.api;

import com.fenxiao.common.security.DistributionAccessGuard;
import com.fenxiao.income.mcn.api.dto.McnIncomeRewardCandidateItemResponse;
import com.fenxiao.income.mcn.api.dto.McnIncomeRewardCandidateSampleResponse;
import com.fenxiao.income.mcn.api.dto.McnIncomeRewardCandidateSummaryResponse;
import com.fenxiao.income.mcn.api.dto.McnIncomeShadowLedgerRefreshRequest;
import com.fenxiao.income.mcn.service.McnIncomeRewardCandidateService;
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
import java.util.List;

/** Finance-only preview endpoint. It cannot create rewards or move money. */
@RestController
@RequestMapping("/admin/income-facts/reward-candidates")
public class McnIncomeRewardCandidateAdminController {
    private final DistributionAccessGuard access;
    private final McnIncomeRewardCandidateService service;

    public McnIncomeRewardCandidateAdminController(DistributionAccessGuard access, McnIncomeRewardCandidateService service) {
        this.access = access; this.service = service;
    }

    @PostMapping("/refresh")
    public McnIncomeRewardCandidateSummaryResponse refresh(@RequestHeader(value = "X-Admin-Token", required = false) String token,
                                                            @RequestHeader(value = "X-Admin-Session", required = false) String session,
                                                            @Valid @RequestBody McnIncomeShadowLedgerRefreshRequest request) {
        access.assertFinanceAccess(token, session); return service.refresh(request.platformCode(), request.businessDate());
    }

    @GetMapping("/summary")
    public McnIncomeRewardCandidateSummaryResponse summary(@RequestHeader(value = "X-Admin-Token", required = false) String token,
                                                            @RequestHeader(value = "X-Admin-Session", required = false) String session,
                                                            @RequestParam String platformCode,
                                                            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate businessDate) {
        access.assertFinanceAccess(token, session); return service.summary(platformCode, businessDate);
    }

    @GetMapping("/items")
    public List<McnIncomeRewardCandidateItemResponse> items(@RequestHeader(value = "X-Admin-Token", required = false) String token,
                                                             @RequestHeader(value = "X-Admin-Session", required = false) String session,
                                                             @RequestParam String platformCode,
                                                             @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate businessDate,
                                                             @RequestParam(defaultValue = "50") int limit) {
        access.assertFinanceAccess(token, session); return service.items(platformCode, businessDate, limit);
    }

    @GetMapping("/sample")
    public McnIncomeRewardCandidateSampleResponse sample(@RequestHeader(value = "X-Admin-Token", required = false) String token,
                                                           @RequestHeader(value = "X-Admin-Session", required = false) String session,
                                                           @RequestParam String runId,
                                                           @RequestParam(defaultValue = "10") int limit) {
        access.assertFinanceAccess(token, session); return service.sample(runId, limit);
    }
}
