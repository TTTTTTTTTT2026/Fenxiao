package com.fenxiao.rule.api.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CommissionPolicyResponse(Long id, String policyCode, String commissionType, String platformCode, String countryCode, String roleCode,
                                       int maxRewardLevel, String status, LocalDateTime effectiveFrom, LocalDateTime effectiveTo,
                                       Long createdBy, Long approvedBy, LocalDateTime approvedAt, String approvalNote,
                                       List<LevelResponse> levels) {
    public record LevelResponse(int rewardLevel, boolean enabled, BigDecimal rewardRate, Integer freezeDays) { }
}
