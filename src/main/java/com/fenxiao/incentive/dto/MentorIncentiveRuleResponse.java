package com.fenxiao.incentive.dto;

import java.time.LocalDateTime;

public record MentorIncentiveRuleResponse(
        long id, String ruleCode, int ruleVersion, String milestoneCode,
        String platformCode, String countryCode, String guildId,
        long amountMinor, String currencyCode, int freezeDays,
        LocalDateTime effectiveFrom, LocalDateTime effectiveTo, String status,
        Long createdBy, Long approvedBy, LocalDateTime approvedAt, String approvalNote) {
}
