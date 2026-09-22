package com.fenxiao.income.mcn.api;

import com.fenxiao.common.security.DistributionAccessGuard;
import com.fenxiao.income.mcn.api.dto.LinkyCursorRecoveryProbeRequest;
import com.fenxiao.income.mcn.api.dto.LinkyCursorRecoveryResponse;
import com.fenxiao.income.mcn.service.LinkyCursorRecoveryService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Finance-authorised operations only; no cursor is returned to the browser or caller. */
@RestController
@RequestMapping("/admin/income-facts/linky-cursor-recovery")
public class LinkyCursorRecoveryAdminController {
    private final DistributionAccessGuard access;
    private final LinkyCursorRecoveryService service;
    public LinkyCursorRecoveryAdminController(DistributionAccessGuard access, LinkyCursorRecoveryService service) { this.access = access; this.service = service; }

    @PostMapping("/probe")
    public LinkyCursorRecoveryResponse probe(@RequestHeader(value = "X-Admin-Token", required = false) String token,
                                             @RequestHeader(value = "X-Admin-Session", required = false) String session,
                                             @Valid @RequestBody LinkyCursorRecoveryProbeRequest request) {
        return service.probe(request, access.assertFinanceAccess(token, session));
    }

    @PostMapping("/resume")
    public LinkyCursorRecoveryResponse resume(@RequestHeader(value = "X-Admin-Token", required = false) String token,
                                              @RequestHeader(value = "X-Admin-Session", required = false) String session) {
        return service.resumeContinuousSync(access.assertFinanceAccess(token, session));
    }
}
