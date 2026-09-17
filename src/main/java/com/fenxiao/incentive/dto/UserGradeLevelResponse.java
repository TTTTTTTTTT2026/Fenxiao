package com.fenxiao.incentive.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record UserGradeLevelResponse(
        long id,
        String levelCode,
        int levelVersion,
        String levelName,
        int levelRank,
        BigDecimal requiredPoints,
        boolean grantsTeamLeader,
        LocalDateTime effectiveFrom,
        LocalDateTime effectiveTo,
        String status,
        Long createdBy,
        Long approvedBy,
        LocalDateTime approvedAt,
        String approvalNote) {
}
