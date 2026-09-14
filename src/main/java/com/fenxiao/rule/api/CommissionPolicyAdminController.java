package com.fenxiao.rule.api;

import com.fenxiao.common.security.DistributionAccessGuard;
import com.fenxiao.rule.api.dto.CommissionPolicyActivationRequest;
import com.fenxiao.rule.api.dto.CommissionPolicyRequest;
import com.fenxiao.rule.api.dto.CommissionPolicyResponse;
import com.fenxiao.rule.service.CommissionPolicyService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Finance-only invitation commission configuration. Mentor commission and operating dividends use separate modules. */
@RestController
@RequestMapping("/admin/commission-policies")
public class CommissionPolicyAdminController {
    private final DistributionAccessGuard access;
    private final CommissionPolicyService service;
    public CommissionPolicyAdminController(DistributionAccessGuard access, CommissionPolicyService service) { this.access = access; this.service = service; }
    @GetMapping public List<CommissionPolicyResponse> list(@RequestHeader(value = "X-Admin-Token", required = false) String token, @RequestHeader(value = "X-Admin-Session", required = false) String session) { access.assertFinanceAccess(token, session); return service.list(); }
    @PostMapping public CommissionPolicyResponse create(@RequestHeader(value = "X-Admin-Token", required = false) String token, @RequestHeader(value = "X-Admin-Session", required = false) String session, @Valid @RequestBody CommissionPolicyRequest request) { return service.createDraft(request, access.assertFinanceAccess(token, session)); }
    @PostMapping("/{id}/activate") public CommissionPolicyResponse activate(@RequestHeader(value = "X-Admin-Token", required = false) String token, @RequestHeader(value = "X-Admin-Session", required = false) String session, @PathVariable long id, @Valid @RequestBody CommissionPolicyActivationRequest request) { return service.activate(id, request.approvalNote(), access.assertFinanceAccess(token, session)); }
    @PostMapping("/{id}/retire") public CommissionPolicyResponse retire(@RequestHeader(value = "X-Admin-Token", required = false) String token, @RequestHeader(value = "X-Admin-Session", required = false) String session, @PathVariable long id) { return service.retire(id, access.assertFinanceAccess(token, session)); }
}
