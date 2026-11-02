package com.fenxiao.income.mcn.api;

import com.fenxiao.common.security.DistributionAccessGuard;
import com.fenxiao.income.mcn.service.VerificationCampaignService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/admin/verification-campaigns")
public class VerificationCampaignController {
    private final DistributionAccessGuard access;
    private final VerificationCampaignService service;
    public VerificationCampaignController(DistributionAccessGuard access, VerificationCampaignService service) {
        this.access=access; this.service=service;
    }
    @GetMapping
    public List<VerificationCampaignService.Campaign> list(@RequestHeader(value="X-Admin-Session",required=false) String session) {
        return service.campaigns(access.assertFinanceAccess(null,session));
    }
    public record ToggleRequest(Boolean enabled) { }
    public record PointsRequest(java.math.BigDecimal rewardPoints) { }
    @PutMapping("/{id}/enabled")
    public void toggle(@RequestHeader(value="X-Admin-Session",required=false) String session,
                       @PathVariable long id, @RequestBody ToggleRequest request) {
        if(request==null || request.enabled()==null) throw new IllegalArgumentException("缺少开关状态");
        service.setEnabled(id,request.enabled(),access.assertFinanceAccess(null,session));
    }
    @PutMapping("/{id}/points")
    public void points(@RequestHeader(value="X-Admin-Session",required=false) String session,
                       @PathVariable long id, @RequestBody PointsRequest request) {
        if(request==null) throw new IllegalArgumentException("缺少奖励积分");
        service.updatePoints(id,request.rewardPoints(),access.assertFinanceAccess(null,session));
    }
    @GetMapping("/awards")
    public List<VerificationCampaignService.Award> awards(@RequestHeader(value="X-Admin-Session",required=false) String session) {
        return service.awards(access.assertFinanceAccess(null,session));
    }
}
