package com.fenxiao.distribution.api;

import com.fenxiao.common.security.DistributionAccessGuard;
import com.fenxiao.distribution.service.LinkyIndividualBindingTargetService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/user-platform-profiles/{userId}/linky-binding-target")
public class LinkyIndividualBindingTargetController {
    private final DistributionAccessGuard access;
    private final LinkyIndividualBindingTargetService targets;
    public LinkyIndividualBindingTargetController(DistributionAccessGuard access, LinkyIndividualBindingTargetService targets) {
        this.access=access; this.targets=targets;
    }
    @PostMapping
    public LinkyIndividualBindingTargetService.Target set(@PathVariable long userId,
            @RequestHeader(value="X-Admin-Session",required=false) String session,
            @RequestBody LinkyIndividualBindingTargetService.Request request, HttpServletRequest http) {
        return targets.set(userId,request,access.assertAdminWriteAccess(null,session),http.getRemoteAddr());
    }
}
