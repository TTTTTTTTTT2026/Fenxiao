package com.fenxiao.incentive.api;

import com.fenxiao.common.security.DistributionAccessGuard;
import com.fenxiao.incentive.dto.*;
import com.fenxiao.incentive.service.IncentiveShadowService;
import com.fenxiao.incentive.service.MentorIncentiveAdminService;
import com.fenxiao.incentive.service.OperatingDividendAdminService;
import com.fenxiao.incentive.service.TeamManagementAdminService;
import com.fenxiao.incentive.service.TokenPointConversionAdminService;
import com.fenxiao.incentive.service.UserGradeAdminService;
import com.fenxiao.incentive.service.UserGradeLevelAdminService;
import com.fenxiao.incentive.service.EffectiveUserQualificationService;
import com.fenxiao.incentive.service.UserGradeAdvancementReviewService;
import com.fenxiao.incentive.service.UserPointFactService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;

@RestController
public class IncentiveAdminController {
    private final DistributionAccessGuard guard;
    private final IncentiveShadowService service;
    private final MentorIncentiveAdminService mentorIncentives;
    private final OperatingDividendAdminService operatingDividends;
    private final UserGradeAdminService userGrades;
    private final TeamManagementAdminService teams;
    private final UserGradeLevelAdminService gradeLevels;
    private final TokenPointConversionAdminService tokenPointConversions;
    private final EffectiveUserQualificationService effectiveUsers;
    private final UserGradeAdvancementReviewService advancementReviews;
    private final UserPointFactService userPoints;
    public IncentiveAdminController(DistributionAccessGuard guard, IncentiveShadowService service, MentorIncentiveAdminService mentorIncentives, OperatingDividendAdminService operatingDividends, UserGradeAdminService userGrades, TeamManagementAdminService teams, UserGradeLevelAdminService gradeLevels, TokenPointConversionAdminService tokenPointConversions, EffectiveUserQualificationService effectiveUsers, UserGradeAdvancementReviewService advancementReviews, UserPointFactService userPoints) { this.guard = guard; this.service = service; this.mentorIncentives = mentorIncentives; this.operatingDividends = operatingDividends; this.userGrades = userGrades; this.teams = teams; this.gradeLevels = gradeLevels; this.tokenPointConversions = tokenPointConversions; this.effectiveUsers = effectiveUsers; this.advancementReviews = advancementReviews; this.userPoints = userPoints; }

    @PostMapping("/admin/incentives/mentor-rules")
    public MentorIncentiveRuleResponse mentorRule(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                         @RequestHeader(value="X-Admin-Session",required=false) String session,
                                         @Valid @RequestBody MentorIncentiveRuleRequest request) {
        guard.assertFinanceAccess(token, session);
        throw mentorCashIncentivePending();
    }
    @PostMapping("/admin/incentives/mentor-rules/batch")
    public java.util.List<MentorIncentiveRuleResponse> mentorRules(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                      @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                                      @Valid @RequestBody MentorIncentiveRuleBatchRequest request) {
        guard.assertFinanceAccess(token, session);
        throw mentorCashIncentivePending();
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
        guard.assertFinanceAccess(token, session);
        throw mentorCashIncentivePending();
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

    @PutMapping("/admin/incentives/teams/{teamId}/operating-profit-share-permission")
    public TeamManagementItemResponse setTeamOperatingProfitSharePermission(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                              @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                                              @PathVariable long teamId,
                                                                              @Valid @RequestBody TeamOperatingProfitSharePermissionRequest request) {
        var actor = guard.assertTeamManageAccess(token, session);
        if (request.enabled()) throw teamRewardPlanClosed();
        return teams.setOperatingProfitShareEnabled(teamId, false, actor);
    }

    @GetMapping("/admin/incentives/user-grade-levels/dashboard")
    public UserGradeLevelDashboardResponse userGradeLevelDashboard(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                    @RequestHeader(value="X-Admin-Session",required=false) String session) {
        guard.assertTeamManageAccess(token, session); return gradeLevels.dashboard();
    }

    @PostMapping("/admin/incentives/user-grade-levels")
    public UserGradeLevelResponse createUserGradeLevel(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                       @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                       @Valid @RequestBody UserGradeLevelRequest request) {
        guard.assertTeamManageAccess(token, session);
        throw legacyPointGradeAuthorityRetired();
    }

    @PostMapping("/admin/incentives/user-grade-levels/{id}/activate")
    public UserGradeLevelResponse activateUserGradeLevel(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                         @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                         @PathVariable long id, @Valid @RequestBody UserGradeApprovalRequest request) {
        guard.assertTeamManageAccess(token, session);
        throw legacyPointGradeAuthorityRetired();
    }

    @PostMapping("/admin/incentives/user-grade-levels/{id}/retire")
    public UserGradeLevelResponse retireUserGradeLevel(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                       @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                       @PathVariable long id) {
        guard.assertTeamManageAccess(token, session);
        throw legacyPointGradeAuthorityRetired();
    }

    @GetMapping("/admin/incentives/token-point-conversions/dashboard")
    public TokenPointConversionDashboardResponse tokenPointConversionDashboard(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                                @RequestHeader(value="X-Admin-Session",required=false) String session) {
        guard.assertTeamManageAccess(token, session); return tokenPointConversions.dashboard();
    }

    @PutMapping("/admin/incentives/token-point-conversions/{platformCode}")
    public TokenPointConversionResponse saveTokenPointConversion(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                 @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                                 @PathVariable String platformCode,
                                                                 @Valid @RequestBody TokenPointConversionRequest request) {
        return tokenPointConversions.save(platformCode, request, guard.assertTeamManageAccess(token, session));
    }

    @PostMapping("/admin/incentives/user-points/refresh")
    public Map<String, Object> refreshUserPoints(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                 @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                 @RequestParam String platformCode) {
        guard.assertTeamManageAccess(token, session);
        return Map.of("platformCode", platformCode.toUpperCase(java.util.Locale.ROOT), "refreshedCount", userPoints.refresh(platformCode));
    }

    @GetMapping("/admin/incentives/user-points/dashboard")
    public UserPointDashboardResponse userPointDashboard(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                         @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                         @RequestParam String platformCode,
                                                         @RequestParam(defaultValue="20") int limit) {
        guard.assertTeamManageAccess(token, session);
        return userPoints.dashboard(platformCode, limit);
    }

    @PostMapping("/admin/incentives/operating-dividend-policies")
    public OperatingDividendPolicyResponse createOperatingDividendPolicy(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                           @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                                           @Valid @RequestBody OperatingDividendPolicyRequest request) {
        guard.assertFinanceAccess(token, session);
        throw legacyOperatingDividendPolicyRetired();
    }

    @PostMapping("/admin/incentives/operating-dividend-policies/batch")
    public java.util.List<OperatingDividendPolicyResponse> createOperatingDividendPolicies(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                                              @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                                                              @Valid @RequestBody OperatingDividendPolicyBatchRequest request) {
        guard.assertFinanceAccess(token, session);
        throw legacyOperatingDividendPolicyRetired();
    }

    @PostMapping("/admin/incentives/operating-dividend-policies/{id}/activate")
    public OperatingDividendPolicyResponse activateOperatingDividendPolicy(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                             @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                                             @PathVariable long id,
                                                                             @Valid @RequestBody OperatingDividendPolicyApprovalRequest request) {
        guard.assertFinanceAccess(token, session);
        throw legacyOperatingDividendPolicyRetired();
    }

    @PostMapping("/admin/incentives/operating-dividend-policies/{id}/retire")
    public OperatingDividendPolicyResponse retireOperatingDividendPolicy(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                           @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                                           @PathVariable long id) {
        guard.assertFinanceAccess(token, session);
        throw legacyOperatingDividendPolicyRetired();
    }

    @GetMapping("/admin/incentives/user-grade-dashboard")
    public UserGradeDashboardResponse userGradeDashboard(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                          @RequestHeader(value="X-Admin-Session",required=false) String session) {
        guard.assertTeamManageAccess(token, session); return userGrades.dashboard();
    }

    @PostMapping("/admin/incentives/user-grade-rules")
    public UserGradeRuleResponse createUserGradeRule(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                      @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                      @Valid @RequestBody UserGradeRuleRequest request) {
        return userGrades.createDraft(request, guard.assertTeamManageAccess(token, session));
    }

    @PostMapping("/admin/incentives/user-grade-rules/{id}/activate")
    public UserGradeRuleResponse activateUserGradeRule(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                        @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                        @PathVariable long id, @Valid @RequestBody UserGradeApprovalRequest request) {
        return userGrades.activate(id, request.approvalNote(), guard.assertTeamManageAccess(token, session));
    }

    @PostMapping("/admin/incentives/user-grade-rules/{id}/retire")
    public UserGradeRuleResponse retireUserGradeRule(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                      @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                      @PathVariable long id) {
        return userGrades.retire(id, guard.assertTeamManageAccess(token, session));
    }

    @PostMapping("/admin/incentives/user-grades/evaluate")
    public java.util.List<UserGradeEvaluationResponse> evaluateUserGrade(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                          @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                                          @Valid @RequestBody UserGradeEvaluationRequest request) {
        guard.assertTeamManageAccess(token, session); return userGrades.evaluate(request.userId(), request.platformCode());
    }

    @PostMapping("/admin/incentives/effective-users/refresh")
    public Map<String, Object> refreshEffectiveUsers(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                      @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                      @RequestParam String platformCode) {
        guard.assertFinanceAccess(token, session);
        return Map.of("platformCode", platformCode.toUpperCase(java.util.Locale.ROOT), "refreshedCount", effectiveUsers.refreshPlatform(platformCode));
    }

    @GetMapping("/admin/incentives/effective-users")
    public java.util.List<EffectiveUserQualificationResponse> effectiveUsers(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                              @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                                              @RequestParam String platformCode,
                                                                              @RequestParam(defaultValue="50") int limit) {
        guard.assertEffectiveUserReadAccess(token, session);
        return effectiveUsers.recent(platformCode, limit);
    }

    @PostMapping("/admin/incentives/effective-users/manual-exclusions")
    public EffectiveUserQualificationResponse excludeEffectiveUser(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                    @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                                    @Valid @RequestBody EffectiveUserCorrectionRequest request) {
        return effectiveUsers.exclude(request, guard.assertEffectiveUserCorrectionAccess(token, session));
    }

    @GetMapping("/admin/incentives/user-grade-advancement-reviews")
    public java.util.List<UserGradeAdvancementReviewResponse> gradeAdvancementReviews(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                                        @RequestHeader(value="X-Admin-Session",required=false) String session) {
        guard.assertTeamManageAccess(token, session); return advancementReviews.recent();
    }

    @PostMapping("/admin/incentives/user-grade-advancement-reviews")
    public UserGradeAdvancementReviewResponse openGradeAdvancementReview(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                           @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                                           @Valid @RequestBody UserGradeAdvancementReviewRequest request) {
        return advancementReviews.open(request, guard.assertTeamManageAccess(token, session));
    }

    @PostMapping("/admin/incentives/user-grade-advancement-reviews/{id}/platinum-evidence")
    public UserGradeAdvancementReviewResponse recordPlatinumEvidence(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                       @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                                       @PathVariable long id, @Valid @RequestBody UserGradePlatinumEvidenceRequest request) {
        return advancementReviews.recordPlatinumEvidence(id, request, guard.assertTeamManageAccess(token, session));
    }

    @PostMapping("/admin/incentives/user-grade-advancement-reviews/{id}/advanced-evidence")
    public UserGradeAdvancementReviewResponse recordAdvancedEvidence(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                      @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                                      @PathVariable long id, @Valid @RequestBody com.fenxiao.incentive.dto.UserGradeAdvancedEvidenceRequest request) {
        return advancementReviews.recordAdvancedEvidence(id, request, guard.assertTeamManageAccess(token, session));
    }

    @PostMapping("/admin/incentives/user-grade-advancement-reviews/{id}/training-confirmation")
    public UserGradeAdvancementReviewResponse confirmGradeTraining(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                     @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                                     @PathVariable long id, @Valid @RequestBody UserGradeAdvancementReviewDecisionRequest request) {
        return advancementReviews.confirmTraining(id, request.note(), guard.assertTeamManageAccess(token, session));
    }

    @PostMapping("/admin/incentives/user-grade-advancement-reviews/{id}/operating-confirmation")
    public UserGradeAdvancementReviewResponse confirmGradeOperation(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                      @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                                      @PathVariable long id, @Valid @RequestBody UserGradeAdvancementReviewDecisionRequest request) {
        return advancementReviews.confirmOperatingValidation(id, request.note(), guard.assertTeamManageAccess(token, session));
    }

    @PostMapping("/admin/incentives/user-grade-advancement-reviews/{id}/responsibility-confirmation")
    public UserGradeAdvancementReviewResponse confirmGradeResponsibility(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                           @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                                           @PathVariable long id, @Valid @RequestBody UserGradeAdvancementReviewDecisionRequest request) {
        return advancementReviews.confirmResponsibility(id, request.note(), guard.assertTeamManageAccess(token, session));
    }

    @PostMapping("/admin/incentives/user-grade-advancement-reviews/{id}/leadership-appointment")
    public UserGradeAdvancementReviewResponse confirmGradeLeadershipAppointment(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                                                                  @RequestHeader(value="X-Admin-Session",required=false) String session,
                                                                                  @PathVariable long id, @Valid @RequestBody UserGradeAdvancementReviewDecisionRequest request) {
        return advancementReviews.confirmLeadershipAppointment(id, request.note(), guard.assertTeamManageAccess(token, session));
    }

    @PostMapping("/admin/incentives/leadership-policies")
    public Map<String,Object> leadershipPolicy(@RequestHeader(value="X-Admin-Token",required=false) String token,
                                               @RequestHeader(value="X-Admin-Session",required=false) String session,
                                               @Valid @RequestBody LeadershipPolicyRequest request) {
        guard.assertAdminWriteAccess(token, session);
        throw legacyOperatingDividendPolicyRetired();
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

    private ResponseStatusException legacyPointGradeAuthorityRetired() {
        return new ResponseStatusException(HttpStatus.GONE, "point-based grade configuration is retired; use direct-effective-user grade rules");
    }

    private ResponseStatusException legacyOperatingDividendPolicyRetired() {
        return new ResponseStatusException(HttpStatus.GONE, "legacy operating-dividend policies are retired; manage teams in the team directory while the future team-reward plan remains closed");
    }

    private ResponseStatusException mentorCashIncentivePending() {
        return new ResponseStatusException(HttpStatus.GONE, "mentor cash incentives are pending a separately approved qualification, result, formula and budget plan; mentor qualification and student relationships remain available");
    }

    private ResponseStatusException teamRewardPlanClosed() {
        return new ResponseStatusException(HttpStatus.GONE, "team operating rewards are globally closed; a team may retain a disabled future-permission record but cannot be enabled before the independent plan is approved");
    }
}
