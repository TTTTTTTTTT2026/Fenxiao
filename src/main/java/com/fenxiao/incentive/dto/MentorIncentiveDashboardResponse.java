package com.fenxiao.incentive.dto;

import java.util.List;

public record MentorIncentiveDashboardResponse(
        long qualifiedMentorCount, long assignedStudentCount, long shadowEntryCount,
        List<MentorDirectoryItemResponse> mentors,
        List<MentorIncentiveRuleResponse> rules,
        List<MentorShadowLedgerItemResponse> recentShadowEntries) {
}
