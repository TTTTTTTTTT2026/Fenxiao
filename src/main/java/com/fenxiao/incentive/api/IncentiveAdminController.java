package com.fenxiao.incentive.api;

import com.fenxiao.common.security.DistributionAccessGuard;
import com.fenxiao.incentive.dto.*;
import com.fenxiao.incentive.service.IncentiveShadowService;
import com.fenxiao.incentive.service.MentorIncentiveAdminService;
import com.fenxiao.incentive.service.OperatingDividendAdminService;
import com.fenxiao.incentive.service.TeamManagementAdminService;
import com.fenxiao.incentive.service.UserGradeAdminService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
public class IncentiveAdminController {
    private final DistributionAccessGuard guard;
    private final IncentiveShadowService service;
    private final MentorIncentiveAdminService mentorIncentives;
    private final OperatingDividendAdminService operatingDividends;
    private final UserGradeAdminService userGrades;
    private final TeamManagementAdminService teams;
    public IncentiveAdminController(DistributionAccessGuard guard, IncentiveShadowService service, MentorIncentiveAdminService mentorIncentives, OperatingDividendAdminService operatingDividends, UserGradeAdminService userGrades, TeamManagementAdminService teams) { this.guard = guard; this.service = service; this.mentorIncentives = mentorIncentives; this.operatingDividends = operatingDividends; this.userGrades = userGrades; this.teams = teams; }

    @PostMapping("/admin/incentives/mentor-rules")
    public MentorIncentiveRuleResponse mentorRule(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                         @RequestHeader(value="X-Admin-Session",required=false) String session,
                                         @Valid @RequestBody MentorIncentiveRuleRequest request) {
        return mentorIncentives.createDraft(request, guard.assertFinanceAccess(token, session));
    }
    @PostMapping("/admin/incentives/mentor-rules/batch")
    public java.util.List<MentorIncentiveRuleResponse> mentorRules(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                      @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                                      @Valid @RequestBody MentorIncentiveRuleBatchRequest request) {
        return mentorIncentives.createDrafts(request, guard.assertFinanceAccess(token, session));
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
    @GetMapping("/admin/incentives/mentors/{userId}/students")
    public java.util.List<MentorAssignedStudentResponse> mentorStudents(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                          @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                                          @PathVariable long userId) {
        guard.assertMentorReadAccess(token, session); return mentorIncentives.currentStudents(userId);
    }

    @GetMapping("/admin/incentives/operating-dividend-dashboard")
    public OperatingDividendDashboardResponse operatingDividendDashboard(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                           @RequestHeader(value="X-Admin-Session",required=false) String session) {
        guard.assertFinanceAccess(token, session); return operatingDividends.dashboard();
    }

    @GetMapping("/admin/incentives/team-management-dashboard")
    public TeamManagementDashboardResponse teamManagementDashboard(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                     @RequestHeader(value="X-Admin-Session",required=false) String session) {
        guard.assertTeamManageAccess(token, session); return teams.dashboard();
    }

    @GetMapping("/admin/incentives/teams/{teamId}/members")
    public java.util.List<TeamManagementMemberResponse> teamMembers(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                      @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                                      @PathVariable long teamId) {
        guard.assertTeamManageAccess(token, session); return teams.members(teamId);
    }

    @PostMapping("/admin/incentives/operating-dividend-policies")
    public OperatingDividendPolicyResponse createOperatingDividendPolicy(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                           @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                                           @Valid @RequestBody OperatingDividendPolicyRequest request) {
        return operatingDividends.createDraft(request, guard.assertFinanceAccess(token, session));
    }

    @PostMapping("/admin/incentives/operating-dividend-policies/batch")
    public java.util.List<OperatingDividendPolicyResponse> createOperatingDividendPolicies(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                                              @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                                                              @Valid @RequestBody OperatingDividendPolicyBatchRequest request) {
        return operatingDividends.createDrafts(request, guard.assertFinanceAccess(token, session));
    }

    @PostMapping("/admin/incentives/operating-dividend-policies/{id}/activate")
    public OperatingDividendPolicyResponse activateOperatingDividendPolicy(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                             @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                                             @PathVariable long id,
                                                                             @Valid @RequestBody OperatingDividendPolicyApprovalRequest request) {
        return operatingDividends.activate(id, request.approvalNote(), guard.assertFinanceAccess(token, session));
    }

    @PostMapping("/admin/incentives/operating-dividend-policies/{id}/retire")
    public OperatingDividendPolicyResponse retireOperatingDividendPolicy(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                           @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                                           @PathVariable long id) {
        return operatingDividends.retire(id, guard.assertFinanceAccess(token, session));
    }

    @GetMapping("/admin/incentives/user-grade-dashboard")
    public UserGradeDashboardResponse userGradeDashboard(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                          @RequestHeader(value="X-Admin-Session",required=false) String session) {
        guard.assertFinanceAccess(token, session); return userGrades.dashboard();
    }

    @PostMapping("/admin/incentives/user-grade-rules")
    public UserGradeRuleResponse createUserGradeRule(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                      @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                      @Valid @RequestBody UserGradeRuleRequest request) {
        return userGrades.createDraft(request, guard.assertFinanceAccess(token, session));
    }

    @PostMapping("/admin/incentives/user-grade-rules/{id}/activate")
    public UserGradeRuleResponse activateUserGradeRule(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                        @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                        @PathVariable long id, @Valid @RequestBody UserGradeApprovalRequest request) {
        return userGrades.activate(id, request.approvalNote(), guard.assertFinanceAccess(token, session));
    }

    @PostMapping("/admin/incentives/user-grade-rules/{id}/retire")
    public UserGradeRuleResponse retireUserGradeRule(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                      @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                      @PathVariable long id) {
        return userGrades.retire(id, guard.assertFinanceAccess(token, session));
    }

    @PostMapping("/admin/incentives/user-grades/evaluate")
    public java.util.List<UserGradeEvaluationResponse> evaluateUserGrade(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                          @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                                          @Valid @RequestBody UserGradeEvaluationRequest request) {
        guard.assertFinanceAccess(token, session); return userGrades.evaluate(request.userId(), request.platformCode());
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
