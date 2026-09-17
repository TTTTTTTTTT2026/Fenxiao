package com.fenxiao.incentive.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record UserGradeRuleResponse(long id, String ruleCode, int ruleVersion, String gradeCode,
                                    String platformCode, String countryCode, String guildId,
                                    int requiredDirectInviteCount, BigDecimal requiredDirectIncome,
                                    LocalDateTime effectiveFrom, LocalDateTime effectiveTo, String status,
                                    Long createdBy, Long approvedBy, LocalDateTime approvedAt, String approvalNote) {
}
