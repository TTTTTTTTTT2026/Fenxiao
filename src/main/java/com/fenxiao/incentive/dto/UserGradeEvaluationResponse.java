package com.fenxiao.incentive.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record UserGradeEvaluationResponse(long userId, String platformCode, String guildId, String gradeCode,
                                          long ruleId, String status, int directInviteCount,
                                          int currentActiveEffectiveInviteCount, BigDecimal directIncome, LocalDateTime qualifiedAt,
                                          LocalDateTime evaluatedAt) {
}
