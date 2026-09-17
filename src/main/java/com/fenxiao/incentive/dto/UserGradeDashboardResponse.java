package com.fenxiao.incentive.dto;

import java.util.List;

public record UserGradeDashboardResponse(long activeRuleCount, long qualifiedTeamLeaderCount,
                                         List<UserGradeRuleResponse> rules,
                                         List<UserGradeEvaluationResponse> recentEvaluations) {
}
