package com.fenxiao.income.mcn.api;

import com.fenxiao.common.security.DistributionAccessGuard;
import com.fenxiao.income.mcn.dto.McnIncomeDeliveryRequest;
import com.fenxiao.income.mcn.dto.McnIncomeDeliveryResponse;
import com.fenxiao.income.mcn.service.McnIncomeRawLedgerService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

/** Internal normalized ingress; the external MCN adapter is enabled only after the shared contract is accepted. */
@RestController
public class McnIncomeRawLedgerController {

    private final DistributionAccessGuard accessGuard;
    private final McnIncomeRawLedgerService rawLedgerService;

    public McnIncomeRawLedgerController(DistributionAccessGuard accessGuard,
                                        McnIncomeRawLedgerService rawLedgerService) {
        this.accessGuard = accessGuard;
        this.rawLedgerService = rawLedgerService;
    }

    @PostMapping("/internal/distribution/mcn/income-ledger-deliveries")
    public McnIncomeDeliveryResponse accept(
            @RequestHeader(value = "X-Internal-Token", required = false) String token,
            @Valid @RequestBody McnIncomeDeliveryRequest request) {
        accessGuard.assertInternalToken(token);
        return rawLedgerService.accept(request);
    }
}
