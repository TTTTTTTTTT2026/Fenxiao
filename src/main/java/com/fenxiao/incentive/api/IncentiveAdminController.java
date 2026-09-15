package com.fenxiao.incentive.api;

import com.fenxiao.common.security.DistributionAccessGuard;
import com.fenxiao.incentive.dto.*;
import com.fenxiao.incentive.service.IncentiveShadowService;
import com.fenxiao.incentive.service.MentorIncentiveAdminService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
public class IncentiveAdminController {
    private final DistributionAccessGuard guard;
    private final IncentiveShadowService service;
    private final MentorIncentiveAdminService mentorIncentives;
    public IncentiveAdminController(DistributionAccessGuard guard, IncentiveShadowService service, MentorIncentiveAdminService mentorIncentives) { this.guard = guard; this.service = service; this.mentorIncentives = mentorIncentives; }

    @PostMapping("/admin/incentives/mentor-rules")
    public MentorIncentiveRuleResponse mentorRule(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                         @RequestHeader(value="X-Admin-Session",required=false) String session,
                                         @Valid @RequestBody MentorIncentiveRuleRequest request) {
        return mentorIncentives.createDraft(request, guard.assertFinanceAccess(token, session));
    }
    @GetMapping("/admin/incentives/mentor-rules")
    public java.util.List<MentorIncentiveRuleResponse> mentorRules(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                     @RequestHeader(value="X-Admin-Session",required=false) String session) {
        guard.assertFinanceAccess(token, session); return mentorIncentives.rules();
    }
    @PostMapping("/admin/incentives/mentor-rules/{id}/activate")
    public MentorIncentiveRuleResponse activateMentorRule(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                           @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                           @PathVariable long id, @Valid @RequestBody MentorIncentiveRuleApprovalRequest request) {
        return mentorIncentives.activate(id, request.approvalNote(), guard.assertFinanceAccess(token, session));
    }
    @PostMapping("/admin/incentives/mentor-rules/{id}/retire")
    public MentorIncentiveRuleResponse retireMentorRule(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                         @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                         @PathVariable long id) {
        return mentorIncentives.retire(id, guard.assertFinanceAccess(token, session));
    }
    @GetMapping("/admin/incentives/mentor-dashboard")
    public MentorIncentiveDashboardResponse mentorDashboard(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                             @RequestHeader(value="X-Admin-Session",required=false) String session) {
        guard.assertMentorReadAccess(token, session); return mentorIncentives.dashboard();
    }
    @PostMapping("/admin/incentives/leadership-policies")
    public Map<String,Object> leadershipPolicy(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                               @RequestHeader(value="X-Admin-Session",required=false) String session,
                                               @Valid @RequestBody LeadershipPolicyRequest request) {
        guard.assertAdminWriteAccess(token, session); return Map.of("policyId", service.configureLeadershipPolicy(request), "ledgerMode", "SHADOW");
    }
    @GetMapping("/admin/incentives/shadow-report")
    public Map<String,Long> report(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                   @RequestHeader(value="X-Admin-Session",required=false) String session) {
        guard.assertAdminAccess(token, session); return service.shadowCounts();
    }
    @PostMapping("/internal/distribution/team-profit-facts")
    public IncentiveShadowService.TeamProfitResult teamProfit(@RequestHeader(value="X-Internal-Token",required=false) String token,
                                                               @Valid @RequestBody TeamProfitFactRequest request) {
        guard.assertInternalToken(token); return service.ingestTeamProfit(request);
    }
}
